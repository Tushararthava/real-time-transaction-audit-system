import { create } from 'zustand';
import { User, Balance } from '@/types/transaction';

interface UserState {
    user: User | null;
    balance: Balance | null;
    setUser: (user: User | null) => void;
    setBalance: (balance: Balance) => void;
    updateBalance: (amount: number) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    balance: null,

    setUser: (user) => set({ user }),

    setBalance: (balance) => set({ balance }),

    updateBalance: (amount) =>
        set((state) => ({
            balance: state.balance
                ? { ...state.balance, amount }
                : null,
        })),

    logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, balance: null });
    },
}));
