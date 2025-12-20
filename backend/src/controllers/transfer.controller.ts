'use strict';

import { Request, Response } from 'express';
import { TransferService } from '../services/transfer.service';
import { prisma } from '../config/database';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class TransferController {
    /**
     * POST /api/transfer
     * Create P2P transfer
     */
    static createTransfer = asyncHandler(async (req: Request, res: Response) => {
        const { receiverId, amount, description, upiPin } = req.body;
        const senderId = req.user!.id;

        // Get idempotency key from headers
        const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

        // Check if receiver exists
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
        });

        if (!receiver) {
            throw new Error('Receiver not found');
        }

        const result = await TransferService.createTransfer({
            senderId,
            receiverId,
            amount,
            description,
            idempotencyKey,
            upiPin, // Add UPI PIN to service call
        });

        res.status(201).json(
            new ApiResponse(201, 'Transfer completed successfully', result)
        );
    });

    /**
     * GET /api/transactions
     * Get transaction history
     */
    static getTransactions = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const { page, limit, type, startDate, endDate } = req.query;

        const result = await TransferService.getTransactionHistory(userId, {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            type: type as 'DEBIT' | 'CREDIT' | undefined,
            startDate: startDate as string | undefined,
            endDate: endDate as string | undefined,
        });

        res.status(200).json(
            new ApiResponse(200, 'Transactions fetched successfully', result)
        );
    });

    /**
     * GET /api/balance
     * Get user balance
     */
    static getBalance = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const balance = await TransferService.getBalance(userId);

        res.status(200).json(
            new ApiResponse(200, 'Balance fetched successfully', balance)
        );
    });

    /**
     * GET /api/users/search
     * Search users by name or email
     */
    static searchUsers = asyncHandler(async (req: Request, res: Response) => {
        const { q } = req.query;
        const currentUserId = req.user!.id;

        if (!q || typeof q !== 'string') {
            throw new Error('Search query is required');
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } }, // Exclude current user
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

        res.status(200).json(
            new ApiResponse(200, 'Users fetched successfully', users)
        );
    });

    /**
     * GET /api/payees/recent
     * Get recent payees
     */
    static getRecentPayees = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

        const recentPayees = await TransferService.getRecentPayees(userId, limit);

        res.status(200).json(
            new ApiResponse(200, 'Recent payees fetched successfully', recentPayees)
        );
    });
}
