'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config();
// Define environment schema with Zod
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    FRONTEND_URL: zod_1.z.string().url(),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100'),
    BCRYPT_ROUNDS: zod_1.z.string().default('12'),
    REDIS_URL: zod_1.z.string().optional(),
});
// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}
exports.env = {
    NODE_ENV: parsed.data.NODE_ENV,
    PORT: parseInt(parsed.data.PORT, 10),
    DATABASE_URL: parsed.data.DATABASE_URL,
    JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY: parsed.data.JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY: parsed.data.JWT_REFRESH_EXPIRY,
    FRONTEND_URL: parsed.data.FRONTEND_URL,
    RATE_LIMIT_WINDOW_MS: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
    BCRYPT_ROUNDS: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
    REDIS_URL: parsed.data.REDIS_URL,
    isDevelopment: parsed.data.NODE_ENV === 'development',
    isProduction: parsed.data.NODE_ENV === 'production',
    isTest: parsed.data.NODE_ENV === 'test',
};
//# sourceMappingURL=env.js.map