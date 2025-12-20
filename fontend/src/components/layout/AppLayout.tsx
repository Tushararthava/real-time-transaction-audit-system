import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { useSocket } from '@/hooks/useSocket';
import { useBalance } from '@/features/balance/api';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    // Initialize WebSocket connection
    useSocket();

    // Fetch and subscribe to balance updates
    useBalance();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    );
}
