import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { RecentPayee } from '@/types/transaction';

export async function getRecentPayees(): Promise<RecentPayee[]> {
    const response = await apiClient.get<RecentPayee[]>('/payees/recent');
    return response.data;
}

export function useRecentPayees() {
    return useQuery({
        queryKey: ['recentPayees'],
        queryFn: getRecentPayees,
    });
}
