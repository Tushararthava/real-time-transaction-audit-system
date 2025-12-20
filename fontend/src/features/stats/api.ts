import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

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

export async function getMonthlyStats(): Promise<MonthlyStats[]> {
    const response = await apiClient.get<MonthlyStats[]>('/stats/monthly');
    return response.data;
}

export function useMonthlyStats() {
    return useQuery({
        queryKey: ['stats', 'monthly'],
        queryFn: getMonthlyStats,
    });
}

export async function getWeeklyStats(): Promise<WeeklyStats[]> {
    const response = await apiClient.get<WeeklyStats[]>('/stats/weekly');
    return response.data;
}

export function useWeeklyStats() {
    return useQuery({
        queryKey: ['stats', 'weekly'],
        queryFn: getWeeklyStats,
    });
}

export async function getDailyStats(): Promise<DailyStats> {
    const response = await apiClient.get<DailyStats>('/stats/daily');
    return response.data;
}

export function useDailyStats() {
    return useQuery({
        queryKey: ['stats', 'daily'],
        queryFn: getDailyStats,
    });
}

export async function getSummaryStats(): Promise<SummaryStats> {
    const response = await apiClient.get<SummaryStats>('/stats/summary');
    return response.data;
}

export function useSummaryStats() {
    return useQuery({
        queryKey: ['stats', 'summary'],
        queryFn: getSummaryStats,
    });
}
