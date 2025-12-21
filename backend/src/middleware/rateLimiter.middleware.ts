'use strict';

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiter for authentication routes
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS, 
    max: env.RATE_LIMIT_MAX_REQUESTS, 
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, 
    legacyHeaders: false, 
    skipSuccessfulRequests: false,
});

//Stricter rate limiter for login attempts
export const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
    skipSuccessfulRequests: true, // Don't count successful logins
});
