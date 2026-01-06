'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const transfer_service_1 = require("./transfer.service");
const logger_1 = require("../config/logger");
class AuditService {
    /**
     * Create immutable audit log entry with hash chaining
     */
    static async createAuditLog(event) {
        try {
            const { eventType, userId, metadata } = event;
            // Get previous audit log entry
            const prevLog = await database_1.prisma.auditLog.findFirst({
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
            const hash = crypto_1.default
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex');
            // Create audit entry
            await database_1.prisma.auditLog.create({
                data: {
                    ...data,
                    hash,
                },
            });
            logger_1.logger.debug(`Audit log created: ${eventType} for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to create audit log: ${error}`);
            // Don't throw - audit logging should not break the main flow
        }
    }
    /**
     * Get audit trail for a user
     */
    static async getAuditTrail(userId, options = {}) {
        const { page = 1, limit = 50 } = options;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            database_1.prisma.auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.auditLog.count({ where: { userId } }),
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
    static async verifyAuditChain(userId) {
        const logs = await database_1.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const expectedPrevHash = i > 0 ? logs[i - 1].hash : null;
            if (log.prevHash !== expectedPrevHash) {
                logger_1.logger.warn(`Audit chain broken at entry ${log.id}`);
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
            const computedHash = crypto_1.default
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex');
            if (computedHash !== log.hash) {
                logger_1.logger.warn(`Hash mismatch at entry ${log.id}`);
                return false;
            }
        }
        return true;
    }
}
exports.AuditService = AuditService;
// 6️⃣ EVENT LISTENERS (Async audit logging)
transfer_service_1.transferEvents.on('TRANSFER_COMPLETED', async (data) => {
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
//# sourceMappingURL=audit.service.js.map