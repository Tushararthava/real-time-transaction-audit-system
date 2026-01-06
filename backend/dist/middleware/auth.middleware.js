'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const asyncHandler_1 = require("../utils/asyncHandler");
const database_1 = require("../config/database");
exports.authenticate = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError_1.default.unauthorized('No token provided');
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        if (decoded.type !== 'access') {
            throw ApiError_1.default.unauthorized('Invalid token type');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true },
        });
        if (!user) {
            throw ApiError_1.default.unauthorized('User not found');
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw ApiError_1.default.unauthorized('Invalid token');
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw ApiError_1.default.unauthorized('Token expired');
        }
        throw error;
    }
});
//Optional authentication - doesn't throw error if no token
exports.optionalAuth = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true },
        });
        if (user) {
            req.user = user;
        }
    }
    catch (error) {
        console.error('Failed to verify optional token:', error);
    }
    next();
});
//# sourceMappingURL=auth.middleware.js.map