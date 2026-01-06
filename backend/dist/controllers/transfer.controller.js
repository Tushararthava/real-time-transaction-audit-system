'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const transfer_service_1 = require("../services/transfer.service");
const database_1 = require("../config/database");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const asyncHandler_1 = require("../utils/asyncHandler");
class TransferController {
    /**
     * POST /api/transfer
     * Create P2P transfer
     */
    static createTransfer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { receiverId, amount, description, upiPin } = req.body;
        const senderId = req.user.id;
        // Get idempotency key from headers
        const idempotencyKey = req.headers['idempotency-key'];
        // Check if receiver exists
        const receiver = await database_1.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new Error('Receiver not found');
        }
        const result = await transfer_service_1.TransferService.createTransfer({
            senderId,
            receiverId,
            amount,
            description,
            idempotencyKey,
            upiPin,
        });
        res.status(201).json(new ApiResponse_1.default(201, 'Transfer completed successfully', result));
    });
    /**
     * GET /api/transactions
     * Get transaction history
     */
    static getTransactions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const { page, limit, type, startDate, endDate } = req.query;
        const result = await transfer_service_1.TransferService.getTransactionHistory(userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            type: type,
            startDate: startDate,
            endDate: endDate,
        });
        res.status(200).json(new ApiResponse_1.default(200, 'Transactions fetched successfully', result));
    });
    /**
     * GET /api/balance
     * Get user balance
     */
    static getBalance = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const balance = await transfer_service_1.TransferService.getBalance(userId);
        res.status(200).json(new ApiResponse_1.default(200, 'Balance fetched successfully', balance));
    });
    /**
     * GET /api/users/search
     * Search users by name or email
     */
    static searchUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { q } = req.query;
        const currentUserId = req.user.id;
        if (!q || typeof q !== 'string') {
            throw new Error('Search query is required');
        }
        const users = await database_1.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    {
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
            },
            take: 10,
        });
        res.status(200).json(new ApiResponse_1.default(200, 'Users fetched successfully', users));
    });
    /**
     * GET /api/payees/recent
     * Get recent payees
     */
    static getRecentPayees = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const recentPayees = await transfer_service_1.TransferService.getRecentPayees(userId, limit);
        res.status(200).json(new ApiResponse_1.default(200, 'Recent payees fetched successfully', recentPayees));
    });
}
exports.TransferController = TransferController;
//# sourceMappingURL=transfer.controller.js.map