export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    FRONTEND_URL: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    BCRYPT_ROUNDS: number;
    REDIS_URL: string | undefined;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
};
//# sourceMappingURL=env.d.ts.map