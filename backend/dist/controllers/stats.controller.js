'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const stats_service_1 = require("../services/stats.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class StatsController {
    /**
     * GET /api/stats/monthly
     * Get 6-month statistics
     */
    static getMonthlyStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const stats = await stats_service_1.StatsService.getMonthlyStats(userId);
        res.status(200).json(new ApiResponse_1.default(200, 'Monthly stats fetched successfully', stats));
    });
    /**
     * GET /api/stats/weekly
     * Get weekly statistics (last 7 days)
     */
    static getWeeklyStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const stats = await stats_service_1.StatsService.getWeeklyStats(userId);
        res.status(200).json(new ApiResponse_1.default(200, 'Weekly stats fetched successfully', stats));
    });
    /**
     * GET /api/stats/daily
     * Get daily statistics (today)
     */
    static getDailyStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const stats = await stats_service_1.StatsService.getDailyStats(userId);
        res.status(200).json(new ApiResponse_1.default(200, 'Daily stats fetched successfully', stats));
    });
    /**
     * GET /api/stats/summary
     * Get summary statistics
     */
    static getSummaryStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.user.id;
        const stats = await stats_service_1.StatsService.getSummaryStats(userId);
        res.status(200).json(new ApiResponse_1.default(200, 'Summary stats fetched successfully', stats));
    });
}
exports.StatsController = StatsController;
//# sourceMappingURL=stats.controller.js.map