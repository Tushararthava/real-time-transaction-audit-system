import { Request, Response } from 'express';
export declare class TransferController {
    /**
     * POST /api/transfer
     * Create P2P transfer
     */
    static createTransfer: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/transactions
     * Get transaction history
     */
    static getTransactions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/balance
     * Get user balance
     */
    static getBalance: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/users/search
     * Search users by name or email
     */
    static searchUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/payees/recent
     * Get recent payees
     */
    static getRecentPayees: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=transfer.controller.d.ts.map