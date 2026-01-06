import { EventEmitter } from 'events';
import { Prisma } from '@prisma/client';
export declare const transferEvents: EventEmitter<[never]>;
interface TransferData {
    senderId: string;
    receiverId: string;
    amount: number;
    description?: string;
    idempotencyKey?: string;
    upiPin: string;
}
export declare class TransferService {
    static createTransfer(data: TransferData): Promise<Prisma.JsonValue | {
        transaction: {
            sender: {
                email: string;
                id: string;
                name: string;
            };
            receiver: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            type: import(".prisma/client").$Enums.TransactionType;
            status: import(".prisma/client").$Enums.TransactionStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: number;
            senderId: string;
            receiverId: string;
            description: string | null;
            idempotencyKey: string | null;
        };
        senderBalance: number;
        receiverBalance: number;
    }>;
    /**
     * Get transaction history with pagination
     */
    static getTransactionHistory(userId: string, options: {
        page?: number;
        limit?: number;
        type?: 'DEBIT' | 'CREDIT';
        startDate?: string;
        endDate?: string;
    }): Promise<{
        transactions: ({
            sender: {
                email: string;
                id: string;
                name: string;
                avatar: string | null;
            };
            receiver: {
                email: string;
                id: string;
                name: string;
                avatar: string | null;
            };
        } & {
            type: import(".prisma/client").$Enums.TransactionType;
            status: import(".prisma/client").$Enums.TransactionStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: number;
            senderId: string;
            receiverId: string;
            description: string | null;
            idempotencyKey: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasMore: boolean;
        };
    }>;
    /**
     * Get user balance
     */
    static getBalance(userId: string): Promise<{
        userId: string;
        id: string;
        updatedAt: Date;
        amount: number;
        version: number;
    }>;
    /**
     * Get recent payees - users the current user has recently transacted with
     */
    static getRecentPayees(userId: string, limit?: number): Promise<any[]>;
    /**
     * Validate transfer data
     */
    private static validateTransfer;
}
export {};
//# sourceMappingURL=transfer.service.d.ts.map