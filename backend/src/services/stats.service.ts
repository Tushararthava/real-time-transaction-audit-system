'use strict';

import { prisma } from '../config/database';

// Define Transaction type from Prisma query result
type Transaction = Awaited<ReturnType<typeof prisma.transaction.findMany>>[number];


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

export class StatsService {
    /**
     * Get 6-month spending and receiving data
     */
    static async getMonthlyStats(userId: string): Promise<MonthlyStats[]> {
        // Get date 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start of month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Get all completed transactions in last 6 months
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'COMPLETED',
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by month
        const monthlyData: { [key: string]: { spent: number; received: number } } = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            monthlyData[monthKey] = { spent: 0, received: 0 };
        }

        // Aggregate transactions
        transactions.forEach((tx: Transaction) => {
            const date = new Date(tx.createdAt);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

            if (monthlyData[monthKey]) {
                if (tx.senderId === userId) {
                    // User spent money
                    monthlyData[monthKey].spent += tx.amount;
                } else {
                    // User received money
                    monthlyData[monthKey].received += tx.amount;
                }
            }
        });

        // Convert to array
        return Object.entries(monthlyData).map(([month, data]) => ({
            month: month.split(' ')[0], // Just month name
            spent: data.spent,
            received: data.received
        }));
    }

    /**
     * Get weekly spending and receiving data (last 7 days)
     */
    static async getWeeklyStats(userId: string): Promise<WeeklyStats[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'COMPLETED',
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by day
        const dailyData: { [key: string]: { spent: number; received: number } } = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayKey = `${dayNames[date.getDay()]} ${date.getDate()}`;
            dailyData[dayKey] = { spent: 0, received: 0 };
        }

        // Aggregate transactions
        transactions.forEach((tx: Transaction) => {
            const date = new Date(tx.createdAt);
            const dayKey = `${dayNames[date.getDay()]} ${date.getDate()}`;

            if (dailyData[dayKey]) {
                if (tx.senderId === userId) {
                    dailyData[dayKey].spent += tx.amount;
                } else {
                    dailyData[dayKey].received += tx.amount;
                }
            }
        });

        // Convert to array
        return Object.entries(dailyData).map(([day, data]) => ({
            day,
            spent: data.spent,
            received: data.received
        }));
    }

    /**
     * Get today's spending and receiving data
     */
    static async getDailyStats(userId: string): Promise<DailyStats> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'COMPLETED',
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        let spent = 0;
        let received = 0;

        transactions.forEach((tx: Transaction) => {
            if (tx.senderId === userId) {
                spent += tx.amount;
            } else {
                received += tx.amount;
            }
        });

        return {
            spent,
            received,
            count: transactions.length
        };
    }

    /**
     * Get summary statistics (averages)
     */
    static async getSummaryStats(userId: string): Promise<SummaryStats> {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'COMPLETED',
                createdAt: {
                    gte: sixMonthsAgo
                }
            }
        });

        let totalSpent = 0;
        let totalReceived = 0;

        transactions.forEach((tx: Transaction) => {
            if (tx.senderId === userId) {
                totalSpent += tx.amount;
            } else {
                totalReceived += tx.amount;
            }
        });

        return {
            totalSpent,
            totalReceived,
            avgSpent: transactions.length > 0 ? Math.round(totalSpent / 6) : 0, // Monthly average
            avgReceived: transactions.length > 0 ? Math.round(totalReceived / 6) : 0,
            totalTransactions: transactions.length
        };
    }
}
