import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthInitializerProps {
    children: ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const { getMe } = useAuth();

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('auth_token');

            if (token) {
                try {
                    // Fetch user data to restore session
                    await getMe();
                } catch (error) {
                    // Token is invalid, clear it
                    console.error('Failed to restore session:', error);
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                }
            }

            setIsInitialized(true);
        };

        initializeAuth();
        
    }, []); 

    // Show loading state while checking authentication
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
