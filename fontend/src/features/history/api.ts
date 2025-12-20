import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { Transaction } from '@/types/transaction';

export async function getTransactions(): Promise<Transaction[]> {
    const response = await apiClient.get<{ transactions: Transaction[]; pagination: any }>('/transactions');
    // Backend returns { transactions: [...], pagination: {...} }
    return response.data.transactions;
}

export function useTransactions() {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: getTransactions,
    });
}
