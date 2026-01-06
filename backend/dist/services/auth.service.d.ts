interface SignupData {
    email: string;
    password: string;
    name: string;
    phoneNumber?: string;
    initialBalance?: number;
    upiPin: string;
}
interface LoginData {
    email: string;
    password: string;
}
export declare class AuthService {
    /**
     * Register a new user
     */
    static signup(data: SignupData): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            id: string;
            name: string;
            avatar: string | null;
            phoneNumber: string | null;
            createdAt: Date;
        };
    }>;
    /**
     * Login user
     */
    static login(data: LoginData): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            id: string;
            name: string;
            avatar: string | null;
            phoneNumber: string | null;
        };
    }>;
    /**
     * Refresh access token
     */
    static refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    /**
     * Verify UPI PIN
     * Returns true if PIN is correct
     * Throws error if account is locked or PIN is wrong
     */
    static verifyUpiPin(userId: string, pin: string): Promise<boolean>;
    /**
     * Get user by ID
     */
    static getUserById(userId: string): Promise<{
        balance: {
            updatedAt: Date;
            amount: number;
        } | null;
        email: string;
        id: string;
        name: string;
        avatar: string | null;
        phoneNumber: string | null;
        isVerified: boolean;
        createdAt: Date;
    }>;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map