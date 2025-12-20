export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    phoneNumber?: string;
}

export interface Transaction {
    id: string;
    amount: number; // in cents
    type: 'DEBIT' | 'CREDIT';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    senderId: string;
    receiverId: string;
    sender?: User;
    receiver?: User;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TransferRequest {
    receiverId: string;
    amount: number; // in cents
    description?: string;
    upiPin?: string; // Required for verification (optional for compatibility)
}

export interface Balance {
    userId: string;
    amount: number; // in cents
    updatedAt: string;
}

export interface RecentPayee {
    user: User;
    lastPaidAt: string;
    totalTransactions: number;
}
