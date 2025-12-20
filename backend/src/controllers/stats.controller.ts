'use strict';

import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';
import { asyncHandler } from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

export class StatsController {
    /**
     * GET /api/stats/monthly
     * Get 6-month statistics
     */
    static getMonthlyStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const stats = await StatsService.getMonthlyStats(userId);

        res.status(200).json(
            new ApiResponse(200, 'Monthly stats fetched successfully', stats)
        );
    });

    /**
     * GET /api/stats/weekly
     * Get weekly statistics (last 7 days)
     */
    static getWeeklyStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const stats = await StatsService.getWeeklyStats(userId);

        res.status(200).json(
            new ApiResponse(200, 'Weekly stats fetched successfully', stats)
        );
    });

    /**
     * GET /api/stats/daily
     * Get daily statistics (today)
     */
    static getDailyStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const stats = await StatsService.getDailyStats(userId);

        res.status(200).json(
            new ApiResponse(200, 'Daily stats fetched successfully', stats)
        );
    });

    /**
     * GET /api/stats/summary
     * Get summary statistics
     */
    static getSummaryStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const stats = await StatsService.getSummaryStats(userId);

        res.status(200).json(
            new ApiResponse(200, 'Summary stats fetched successfully', stats)
        );
    });
}
