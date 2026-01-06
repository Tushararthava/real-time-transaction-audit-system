interface AuditEvent {
    eventType: string;
    userId: string;
    metadata: any;
}
export declare class AuditService {
    /**
     * Create immutable audit log entry with hash chaining
     */
    static createAuditLog(event: AuditEvent): Promise<void>;
    /**
     * Get audit trail for a user
     */
    static getAuditTrail(userId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        logs: {
            userId: string;
            id: string;
            createdAt: Date;
            eventType: string;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            prevHash: string | null;
            hash: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
    /**
     * Verify audit chain integrity
     */
    static verifyAuditChain(userId: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=audit.service.d.ts.map