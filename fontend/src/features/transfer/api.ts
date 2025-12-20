import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, TransferRequest } from '@/types/transaction';
import { generateIdempotencyKey } from '@/lib/utils';
import { useUserStore } from '@/store/user.store';

export async function searchUsers(query: string): Promise<User[]> {
    if (query.length < 2) return [];

    try {
        const response = await apiClient.get<User[]>('/users/search', {
            params: { q: query },
        });
        return response.data;
    } catch (error) {
        console.error('User search failed:', error);
        return [];
    }
}

export function useSearchUsers(query: string) {
    return useQuery({
        queryKey: ['users', 'search', query],
        queryFn: () => searchUsers(query),
        enabled: query.length >= 2,
    });
}

export async function createTransfer(data: TransferRequest) {
    const idempotencyKey = generateIdempotencyKey();

    const response = await apiClient.post('/transfer', data, {
        headers: {
            'idempotency-key': idempotencyKey,
        },
    });
    return response.data;
}

export function useCreateTransfer() {
    const queryClient = useQueryClient();
    const { updateBalance } = useUserStore();

    return useMutation({
        mutationFn: createTransfer,
        onSuccess: (data) => {
            // Update balance optimistically
            updateBalance(-data.amount);

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recentPayees'] });
        },
    });
}
