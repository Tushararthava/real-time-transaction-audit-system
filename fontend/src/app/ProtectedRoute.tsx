import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user.store';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user } = useUserStore();
    const token = localStorage.getItem('auth_token');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
