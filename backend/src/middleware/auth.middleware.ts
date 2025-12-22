'use strict';

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import ApiError from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../config/database';


declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
            };
        }
    }
}

interface JwtPayload {
    userId: string;
    email: string;
    type: 'access' | 'refresh';
}




export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7); 

    try {
        
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

        if (decoded.type !== 'access') {
            throw ApiError.unauthorized('Invalid token type');
        }

        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true },
        });

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw ApiError.unauthorized('Invalid token');
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw ApiError.unauthorized('Token expired');
        }
        throw error;
    }
});


//Optional authentication - doesn't throw error if no token

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true },
        });

        if (user) {
            req.user = user;
        }
    } catch (error) {
        console.error('Failed to verify optional token:', error);
    }

    next();
});
