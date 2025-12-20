'use strict';

import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import ApiError from '../utils/ApiError';
import { TokenService } from './token.service';
import { logger } from '../config/logger';

interface SignupData {
    email: string;
    password: string;
    name: string;
    phoneNumber?: string;
    initialBalance?: number; // in cents
    upiPin: string; // 4-6 digit PIN
}

interface LoginData {
    email: string;
    password: string;
}

export class AuthService {
    /**
     * Register a new user
     */
    static async signup(data: SignupData) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw ApiError.conflict('User with this email already exists');
        }

        // Validate UPI PIN format
        if (!data.upiPin || !/^\d{4,6}$/.test(data.upiPin)) {
            throw ApiError.badRequest('UPI PIN must be 4-6 digits');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

        // Hash UPI PIN
        const hashedUpiPin = await bcrypt.hash(data.upiPin, env.BCRYPT_ROUNDS);

        // Create user and balance in transaction
        const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create user
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                    upiPin: hashedUpiPin,
                    pinAttempts: 0,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                    phoneNumber: true,
                    createdAt: true,
                },
            });

            // Create balance for user with dynamic initial amount
            const initialAmount = data.initialBalance ?? 0; // Default to $0 if not provided
            await tx.balance.create({
                data: {
                    userId: newUser.id,
                    amount: initialAmount,
                },
            });

            return newUser;
        });

        // Generate tokens
        const tokens = TokenService.generateTokenPair({
            userId: user.id,
            email: user.email,
        });

        logger.info(`New user registered: ${user.email}`);

        return {
            user,
            ...tokens,
        };
    }

    /**
     * Login user
     */
    static async login(data: LoginData) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                avatar: true,
                phoneNumber: true,
            },
        });

        if (!user) {
            throw ApiError.unauthorized('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw ApiError.unauthorized('Invalid credentials');
        }

        // Generate tokens
        const tokens = TokenService.generateTokenPair({
            userId: user.id,
            email: user.email,
        });

        logger.info(`User logged in: ${user.email}`);

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            ...tokens,
        };
    }

    /**
     * Refresh access token
     */
    static async refreshAccessToken(refreshToken: string) {
        try {
            // Verify refresh token
            const payload = TokenService.verifyRefreshToken(refreshToken);

            // Check if user still exists
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true },
            });

            if (!user) {
                throw ApiError.unauthorized('User not found');
            }

            // Generate new access token
            const accessToken = TokenService.generateAccessToken({
                userId: user.id,
                email: user.email,
            });

            return { accessToken };
        } catch (error) {
            throw ApiError.unauthorized('Invalid refresh token');
        }
    }

    /**
     * Verify UPI PIN
     * Returns true if PIN is correct
     * Throws error if account is locked or PIN is wrong
     */
    static async verifyUpiPin(userId: string, pin: string): Promise<boolean> {
        // DEBUG
        console.log('verifyUpiPin called with:');
        console.log('- userId:', userId);
        console.log('- pin:', pin);
        console.log('- pin type:', typeof pin);
        console.log('- pin length:', pin?.length);

        // Validate PIN parameter
        if (!pin || pin.length < 4 || pin.length > 6) {
            console.log('FAILED: PIN validation failed!');
            throw ApiError.badRequest('Invalid PIN. PIN must be 4-6 digits.');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                upiPin: true,
                pinAttempts: true,
                pinLockedUntil: true,
            },
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        if (!user.upiPin) {
            throw ApiError.badRequest('UPI PIN not set. Please contact support.');
        }

        // Check if account is locked
        if (user.pinLockedUntil && new Date() < user.pinLockedUntil) {
            const minutesLeft = Math.ceil(
                (user.pinLockedUntil.getTime() - Date.now()) / 60000
            );
            throw ApiError.forbidden(
                `Account locked due to multiple wrong PIN attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
            );
        }

        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, user.upiPin);

        if (!isPinValid) {
            // Increment wrong attempts
            const newAttempts = user.pinAttempts + 1;

            // Lock account after 3 wrong attempts (15 minutes)
            if (newAttempts >= 3) {
                const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        pinAttempts: newAttempts,
                        pinLockedUntil: lockUntil,
                    },
                });

                throw ApiError.forbidden(
                    'Account locked for 15 minutes due to 3 wrong PIN attempts.'
                );
            } else {
                // Just increment attempts
                await prisma.user.update({
                    where: { id: userId },
                    data: { pinAttempts: newAttempts },
                });

                throw ApiError.unauthorized(
                    `Wrong UPI PIN. ${3 - newAttempts} attempt${3 - newAttempts > 1 ? 's' : ''} remaining.`
                );
            }
        }

        // PIN is correct - reset attempts
        if (user.pinAttempts > 0 || user.pinLockedUntil) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    pinAttempts: 0,
                    pinLockedUntil: null,
                },
            });
        }

        logger.info(`UPI PIN verified successfully for user: ${userId}`);
        return true;
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                phoneNumber: true,
                isVerified: true,
                createdAt: true,
                balance: {
                    select: {
                        amount: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        return user;
    }
}
