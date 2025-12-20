import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/store/user.store';
import { queryClient } from '@/lib/queryClient';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const { updateBalance } = useUserStore();

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('✅ Socket connected');
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        // Balance update event
        socket.on('balance:updated', (data: { newBalance: number; timestamp: string }) => {
            console.log('💰 Balance updated:', data.newBalance);
            updateBalance(data.newBalance);
            // Invalidate balance query to refetch
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });

        // New transaction event
        socket.on('transaction:new', (data: { transaction: any; newBalance: number; timestamp: string }) => {
            console.log('📨 New transaction received:', data.transaction);
            updateBalance(data.newBalance);
            // Invalidate transactions query to refetch
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [updateBalance]);

    return socketRef.current;
}
