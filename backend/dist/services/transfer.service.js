'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferService = exports.transferEvents = void 0;
const events_1 = require("events");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const logger_1 = require("../config/logger");
const auth_service_1 = require("./auth.service");
exports.transferEvents = new events_1.EventEmitter();
class TransferService {
    static async createTransfer(data) {
        const { senderId, receiverId, amount, description, idempotencyKey, upiPin } = data;
        await auth_service_1.AuthService.verifyUpiPin(senderId, upiPin);
        logger_1.logger.info(`UPI PIN verified for transfer from user: ${senderId}`);
        if (idempotencyKey) {
            const cached = await database_1.prisma.idempotentRequest.findUnique({
                where: { idempotencyKey },
            });
            if (cached) {
                logger_1.logger.info(`Returning cached response for idempotency key: ${idempotencyKey}`);
                return cached.response;
            }
        }
        this.validateTransfer({ senderId, receiverId, amount });
        const result = await database_1.prisma.$transaction(async (tx) => {
            const senderBalance = await tx.balance.findUnique({
                where: { userId: senderId },
            });
            if (!senderBalance) {
                throw ApiError_1.default.notFound('Sender balance not found');
            }
            //  Check sufficient funds
            if (senderBalance.amount < amount) {
                throw ApiError_1.default.badRequest('Insufficient balance');
            }
            // LOCK receiver's balance
            const receiverBalance = await tx.balance.findUnique({
                where: { userId: receiverId },
            });
            if (!receiverBalance) {
                throw ApiError_1.default.notFound('Receiver not found');
            }
            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    senderId,
                    receiverId,
                    amount,
                    description,
                    type: 'DEBIT',
                    status: 'COMPLETED',
                    idempotencyKey,
                },
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            // Update sender balance
            const newSenderBalance = await tx.balance.update({
                where: { userId: senderId },
                data: { amount: { decrement: amount } },
            });
            // Update receiver balance
            const newReceiverBalance = await tx.balance.update({
                where: { userId: receiverId },
                data: { amount: { increment: amount } },
            });
            await tx.ledgerEntry.create({
                data: {
                    transactionId: transaction.id,
                    userId: senderId,
                    type: 'DEBIT',
                    amount,
                    balanceBefore: senderBalance.amount,
                    balanceAfter: newSenderBalance.amount,
                },
            });
            // Create CREDIT entry for receiver
            await tx.ledgerEntry.create({
                data: {
                    transactionId: transaction.id,
                    userId: receiverId,
                    type: 'CREDIT',
                    amount,
                    balanceBefore: receiverBalance.amount,
                    balanceAfter: newReceiverBalance.amount,
                },
            });
            return {
                transaction,
                senderBalance: newSenderBalance.amount,
                receiverBalance: newReceiverBalance.amount,
            };
        }, {
            timeout: 10000, // 10 second timeout
        });
        if (idempotencyKey) {
            const requestHash = crypto_1.default
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex');
            await database_1.prisma.idempotentRequest.create({
                data: {
                    idempotencyKey,
                    requestHash,
                    response: result,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });
        }
        exports.transferEvents.emit('TRANSFER_COMPLETED', {
            transactionId: result.transaction.id,
            senderId,
            receiverId,
            amount,
            senderBalance: result.senderBalance,
            receiverBalance: result.receiverBalance,
            timestamp: new Date(),
        });
        logger_1.logger.info(`Transfer completed: ${senderId} -> ${receiverId}, amount: ${amount}`);
        return result;
    }
    /**
     * Get transaction history with pagination
     */
    static async getTransactionHistory(userId, options) {
        const { page = 1, limit = 20, type, startDate, endDate } = options;
        const skip = (page - 1) * limit;
        const where = {
            OR: [
                { senderId: userId },
                { receiverId: userId },
            ],
        };
        if (type) {
            if (type === 'DEBIT') {
                where.senderId = userId;
            }
            else {
                where.receiverId = userId;
            }
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [transactions, total] = await Promise.all([
            database_1.prisma.transaction.findMany({
                where,
                include: {
                    sender: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.transaction.count({ where }),
        ]);
        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + transactions.length < total,
            },
        };
    }
    /**
     * Get user balance
     */
    static async getBalance(userId) {
        const balance = await database_1.prisma.balance.findUnique({
            where: { userId },
        });
        if (!balance) {
            throw ApiError_1.default.notFound('Balance not found');
        }
        return balance;
    }
    /**
     * Get recent payees - users the current user has recently transacted with
     */
    static async getRecentPayees(userId, limit = 5) {
        const transactions = await database_1.prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'COMPLETED'
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, avatar: true }
                },
                receiver: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        // Group by user and calculate stats
        const payeeMap = new Map();
        transactions.forEach((tx) => {
            // Get the other user (not the current user)
            const otherUser = tx.senderId === userId ? tx.receiver : tx.sender;
            if (!payeeMap.has(otherUser.id)) {
                payeeMap.set(otherUser.id, {
                    user: otherUser,
                    lastPaidAt: tx.createdAt.toISOString(),
                    totalTransactions: 0
                });
            }
            payeeMap.get(otherUser.id).totalTransactions++;
        });
        // Convert to array, sort by most recent, and limit results
        return Array.from(payeeMap.values())
            .sort((a, b) => new Date(b.lastPaidAt).getTime() - new Date(a.lastPaidAt).getTime())
            .slice(0, limit);
    }
    /**
     * Validate transfer data
     */
    static validateTransfer(data) {
        if (data.amount <= 0) {
            throw ApiError_1.default.badRequest('Amount must be greater than 0');
        }
        if (!Number.isInteger(data.amount)) {
            throw ApiError_1.default.badRequest('Amount must be an integer (cents)');
        }
        if (data.senderId === data.receiverId) {
            throw ApiError_1.default.badRequest('Cannot send money to yourself');
        }
    }
}
exports.TransferService = TransferService;
//# sourceMappingURL=transfer.service.js.map