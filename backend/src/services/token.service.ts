'use strict';

import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
    userId: string;
    email: string;
}

export class TokenService {
    /**
     * Generate JWT access token (short-lived)
     */
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(
            { ...payload, type: 'access' },
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
        );
    }

    /**
     * Generate JWT refresh token (long-lived)
     */
    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(
            { ...payload, type: 'refresh' },
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions
        );
    }

    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(payload: TokenPayload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): TokenPayload {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload & { type: string };

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        return {
            userId: decoded.userId,
            email: decoded.email,
        };
    }
}
