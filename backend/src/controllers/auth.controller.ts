'use strict';

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
    /**
     * POST /api/auth/signup
     * Register new user
     */
    static signup = asyncHandler(async (req: Request, res: Response) => {
        const result = await AuthService.signup(req.body);

        res.status(201).json(
            new ApiResponse(201, 'User registered successfully', result)
        );
    });

    /**
     * POST /api/auth/login
     * User login
     */
    static login = asyncHandler(async (req: Request, res: Response) => {
        const result = await AuthService.login(req.body);

        res.status(200).json(
            new ApiResponse(200, 'Login successful', result)
        );
    });

    /**
     * POST /api/auth/refresh
     * Refresh access token
     */
    static refresh = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const result = await AuthService.refreshAccessToken(refreshToken);

        res.status(200).json(
            new ApiResponse(200, 'Token refreshed successfully', result)
        );
    });

    /**
     * GET /api/auth/me
     * Get current user
     */
    static getMe = asyncHandler(async (req: Request, res: Response) => {
        const user = await AuthService.getUserById(req.user!.id);

        res.status(200).json(
            new ApiResponse(200, 'User fetched successfully', user)
        );
    });

    /**
     * POST /api/auth/logout
     * Logout user (client-side token removal)
     */
    static logout = asyncHandler(async (_req: Request, res: Response) => {
        // In a stateless JWT system, logout is handled client-side
        // Here we just acknowledge the request
        res.status(200).json(
            new ApiResponse(200, 'Logged out successfully')
        );
    });
}
