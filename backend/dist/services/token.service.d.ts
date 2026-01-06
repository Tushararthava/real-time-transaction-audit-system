interface TokenPayload {
    userId: string;
    email: string;
}
export declare class TokenService {
    /**
     * Generate JWT access token (short-lived)
     */
    static generateAccessToken(payload: TokenPayload): string;
    /**
     * Generate JWT refresh token (long-lived)
     */
    static generateRefreshToken(payload: TokenPayload): string;
    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(payload: TokenPayload): {
        accessToken: string;
        refreshToken: string;
    };
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): TokenPayload;
}
export {};
//# sourceMappingURL=token.service.d.ts.map