import { Request, Response } from 'express';
export declare class AuthController {
    /**
     * POST /api/auth/signup
     * Register new user
     */
    static signup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * POST /api/auth/login
     * User login
     */
    static login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * POST /api/auth/refresh
     * Refresh access token
     */
    static refresh: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /api/auth/me
     * Get current user
     */
    static getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * POST /api/auth/logout
     * Logout user (client-side token removal)
     */
    static logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=auth.controller.d.ts.map