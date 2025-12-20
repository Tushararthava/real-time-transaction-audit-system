'use strict';

import crypto from 'crypto';
import { prisma } from '../config/database';
import { transferEvents } from './transfer.service';
import { logger } from '../config/logger';

interface AuditEvent {
    eventType: string;
    userId: string;
    metadata: any;
}

export class AuditService {
    /**
     * Create immutable audit log entry with hash chaining
     */
    static async createAuditLog(event: AuditEvent) {
        try {
            const { eventType, userId, metadata } = event;

            // Get previous audit log entry
            const prevLog = await prisma.auditLog.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { hash: true },
            });

            const data = {
                eventType,
                userId,
                metadata,
                prevHash: prevLog?.hash || null,
                createdAt: new Date(),
            };

            // Compute hash (blockchain-style)
            const hash = crypto
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex');

            // Create audit entry
            await prisma.auditLog.create({
                data: {
                    ...data,
                    hash,
                },
            });

            logger.debug(`Audit log created: ${eventType} for user ${userId}`);
        } catch (error) {
            logger.error(`Failed to create audit log: ${error}`);
            // Don't throw - audit logging should not break the main flow
        }
    }

    /**
     * Get audit trail for a user
     */
    static async getAuditTrail(userId: string, options: { page?: number; limit?: number } = {}) {
        const { page = 1, limit = 50 } = options;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where: { userId } }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + logs.length < total,
            },
        };
    }

    /**
     * Verify audit chain integrity
     */
    static async verifyAuditChain(userId: string): Promise<boolean> {
        const logs = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });

        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const expectedPrevHash = i > 0 ? logs[i - 1].hash : null;

            if (log.prevHash !== expectedPrevHash) {
                logger.warn(`Audit chain broken at entry ${log.id}`);
                return false;
            }

            // Recompute hash
            const data = {
                eventType: log.eventType,
                userId: log.userId,
                metadata: log.metadata,
                prevHash: log.prevHash,
                createdAt: log.createdAt,
            };

            const computedHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex');

            if (computedHash !== log.hash) {
                logger.warn(`Hash mismatch at entry ${log.id}`);
                return false;
            }
        }

        return true;
    }
}

// 6️⃣ EVENT LISTENERS (Async audit logging)
transferEvents.on('TRANSFER_COMPLETED', async (data) => {
    await AuditService.createAuditLog({
        eventType: 'TRANSFER',
        userId: data.senderId,
        metadata: {
            transactionId: data.transactionId,
            receiverId: data.receiverId,
            amount: data.amount,
            timestamp: data.timestamp,
        },
    });

    // Also log for receiver
    await AuditService.createAuditLog({
        eventType: 'TRANSFER_RECEIVED',
        userId: data.receiverId,
        metadata: {
            transactionId: data.transactionId,
            senderId: data.senderId,
            amount: data.amount,
            timestamp: data.timestamp,
        },
    });
});
