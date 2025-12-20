import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { Balance } from '@/types/transaction';
import { useUserStore } from '@/store/user.store';
import { useEffect } from 'react';

export async function getBalance(): Promise<Balance> {
    const response = await apiClient.get<Balance>('/balance');
    return response.data;
}

export function useBalance() {
    const { setBalance } = useUserStore();

    const query = useQuery({
        queryKey: ['balance'],
        queryFn: getBalance,
    });

    useEffect(() => {
        if (query.data) {
            setBalance(query.data);
        }
    }, [query.data, setBalance]);

    return query;
}
