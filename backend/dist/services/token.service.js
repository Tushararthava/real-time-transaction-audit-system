'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
class TokenService {
    /**
     * Generate JWT access token (short-lived)
     */
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRY });
    }
    /**
     * Generate JWT refresh token (long-lived)
     */
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRY });
    }
    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return {
            userId: decoded.userId,
            email: decoded.email,
        };
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=token.service.js.map