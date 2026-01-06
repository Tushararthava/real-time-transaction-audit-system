import { Request, Response } from 'express';
export declare class StatsController {
    /**
     * GET /api/stats/monthly
     * Get 6-month statistics
     */
    static getMonthlyStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/stats/weekly
     * Get weekly statistics (last 7 days)
     */
    static getWeeklyStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/stats/daily
     * Get daily statistics (today)
     */
    static getDailyStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/stats/summary
     * Get summary statistics
     */
    static getSummaryStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=stats.controller.d.ts.map