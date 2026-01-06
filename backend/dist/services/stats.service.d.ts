interface MonthlyStats {
    month: string;
    spent: number;
    received: number;
}
interface WeeklyStats {
    day: string;
    spent: number;
    received: number;
}
interface DailyStats {
    spent: number;
    received: number;
    count: number;
}
interface SummaryStats {
    avgSpent: number;
    avgReceived: number;
    totalSpent: number;
    totalReceived: number;
    totalTransactions: number;
}
export declare class StatsService {
    /**
     * Get 6-month spending and receiving data
     */
    static getMonthlyStats(userId: string): Promise<MonthlyStats[]>;
    /**
     * Get weekly spending and receiving data (last 7 days)
     */
    static getWeeklyStats(userId: string): Promise<WeeklyStats[]>;
    /**
     * Get today's spending and receiving data
     */
    static getDailyStats(userId: string): Promise<DailyStats>;
    /**
     * Get summary statistics (averages)
     */
    static getSummaryStats(userId: string): Promise<SummaryStats>;
}
export {};
//# sourceMappingURL=stats.service.d.ts.map