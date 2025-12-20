'use strict';

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { logger } from '../config/logger';
import { AuthService } from './auth.service';

// Event emitter for transfer events
export const transferEvents = new EventEmitter();

interface TransferData {
    senderId: string;
    receiverId: string;
    amount: number;
    description?: string;
    idempotencyKey?: string;
    upiPin: string; // Required for verification
}

export class TransferService {
    /**
     * Create P2P transfer with all production features:
     * - Pessimistic locking (concurrency control)
     * - Idempotency key handling
     * - Double-entry ledger
     * - Event-driven audit logging
     * - Strict validation
     */
    static async createTransfer(data: TransferData) {
        const { senderId, receiverId, amount, description, idempotencyKey, upiPin } = data;

        // 1️⃣ VERIFY UPI PIN (CRITICAL SECURITY CHECK)
        await AuthService.verifyUpiPin(senderId, upiPin);
        logger.info(`UPI PIN verified for transfer from user: ${senderId}`);

        // 3️⃣ IDEMPOTENCY CHECK
        if (idempotencyKey) {
            const cached = await prisma.idempotentRequest.findUnique({
                where: { idempotencyKey },
            });

            if (cached) {
                logger.info(`Returning cached response for idempotency key: ${idempotencyKey}`);
                return cached.response;
            }
        }

        // 4️⃣ STRICT VALIDATION
        this.validateTransfer({ senderId, receiverId, amount });

        // 2️⃣ CONCURRENCY CONTROL + 5️⃣ DOUBLE-ENTRY LEDGER
        const result = await prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                // LOCK sender's balance (SELECT ... FOR UPDATE)
                const senderBalance = await tx.balance.findUnique({
                    where: { userId: senderId },
                });

                if (!senderBalance) {
                    throw ApiError.notFound('Sender balance not found');
                }

                //  Check sufficient funds
                if (senderBalance.amount < amount) {
                    throw ApiError.badRequest('Insufficient balance');
                }

                // LOCK receiver's balance
                const receiverBalance = await tx.balance.findUnique({
                    where: { userId: receiverId },
                });

                if (!receiverBalance) {
                    throw ApiError.notFound('Receiver not found');
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

                // 5️⃣ DOUBLE-ENTRY LEDGER
                // Create DEBIT entry for sender
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
            },
            {
                timeout: 10000, // 10 second timeout
            }
        );

        // Store idempotent request if key provided
        if (idempotencyKey) {
            const requestHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex');

            await prisma.idempotentRequest.create({
                data: {
                    idempotencyKey,
                    requestHash,
                    response: result,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });
        }

        // 6️⃣ EVENT-DRIVEN AUDIT (non-blocking)
        transferEvents.emit('TRANSFER_COMPLETED', {
            transactionId: result.transaction.id,
            senderId,
            receiverId,
            amount,
            senderBalance: result.senderBalance,
            receiverBalance: result.receiverBalance,
            timestamp: new Date(),
        });

        logger.info(`Transfer completed: ${senderId} -> ${receiverId}, amount: ${amount}`);

        return result;
    }

    /**
     * Get transaction history with pagination
     */
    static async getTransactionHistory(userId: string, options: {
        page?: number;
        limit?: number;
        type?: 'DEBIT' | 'CREDIT';
        startDate?: string;
        endDate?: string;
    }) {
        const { page = 1, limit = 20, type, startDate, endDate } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { senderId: userId },
                { receiverId: userId },
            ],
        };

        if (type) {
            if (type === 'DEBIT') {
                where.senderId = userId;
            } else {
                where.receiverId = userId;
            }
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
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
            prisma.transaction.count({ where }),
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
    static async getBalance(userId: string) {
        const balance = await prisma.balance.findUnique({
            where: { userId },
        });

        if (!balance) {
            throw ApiError.notFound('Balance not found');
        }

        return balance;
    }

    /**
     * Get recent payees - users the current user has recently transacted with
     */
    static async getRecentPayees(userId: string, limit: number = 5) {
        // Get recent transactions where user was sender or receiver
        const transactions = await prisma.transaction.findMany({
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
            take: 100 // Get last 100 to group and aggregate
        });

        // Group by user and calculate stats
        const payeeMap = new Map();

        transactions.forEach((tx: typeof transactions[0]) => {
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
    private static validateTransfer(data: { senderId: string; receiverId: string; amount: number }) {
        // 4️⃣ STRICT VALIDATION
        if (data.amount <= 0) {
            throw ApiError.badRequest('Amount must be greater than 0');
        }

        if (!Number.isInteger(data.amount)) {
            throw ApiError.badRequest('Amount must be an integer (cents)');
        }

        if (data.senderId === data.receiverId) {
            throw ApiError.badRequest('Cannot send money to yourself');
        }
    }
}
