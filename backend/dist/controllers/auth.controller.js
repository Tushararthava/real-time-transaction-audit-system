'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const asyncHandler_1 = require("../utils/asyncHandler");
class AuthController {
    /**
     * POST /api/auth/signup
     * Register new user
     */
    static signup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.AuthService.signup(req.body);
        res.status(201).json(new ApiResponse_1.default(201, 'User registered successfully', result));
    });
    /**
     * POST /api/auth/login
     * User login
     */
    static login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.AuthService.login(req.body);
        res.status(200).json(new ApiResponse_1.default(200, 'Login successful', result));
    });
    /**
     * POST /api/auth/refresh
     * Refresh access token
     */
    static refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await auth_service_1.AuthService.refreshAccessToken(refreshToken);
        res.status(200).json(new ApiResponse_1.default(200, 'Token refreshed successfully', result));
    });
    /**
     * GET /api/auth/me
     * Get current user
     */
    static getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await auth_service_1.AuthService.getUserById(req.user.id);
        res.status(200).json(new ApiResponse_1.default(200, 'User fetched successfully', user));
    });
    /**
     * POST /api/auth/logout
     * Logout user (client-side token removal)
     */
    static logout = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        res.status(200).json(new ApiResponse_1.default(200, 'Logged out successfully'));
    });
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map