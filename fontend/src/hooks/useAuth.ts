import { useUserStore } from '@/store/user.store';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/axios';
import { User } from '@/types/transaction';

interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

interface SignupRequest {
    email: string;
    password: string;
    name: string;
    initialBalance?: number; // in cents
    upiPin: string; // 4-6 digit PIN
}

export function useAuth() {
    const navigate = useNavigate();
    const { user, setUser, logout: storeLogout } = useUserStore();

    const login = async (email: string, password: string) => {
        try {
            const response = await apiClient.post<LoginResponse>('/auth/login', {
                email,
                password,
            });

            const { user: userData, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('auth_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            // Set user in store
            setUser(userData);

            // Navigate to dashboard
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const signup = async (data: SignupRequest) => {
        try {
            const response = await apiClient.post<LoginResponse>('/auth/signup', data);

            const { user: userData, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('auth_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            // Set user in store
            setUser(userData);

            // Navigate to dashboard
            navigate('/');
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state regardless of backend response
            storeLogout();
            navigate('/login');
        }
    };

    const getMe = async () => {
        try {
            const response = await apiClient.get<User>('/auth/me');
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            throw error;
        }
    };

    return {
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        getMe,
    };
}
