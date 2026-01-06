'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
require("express-async-errors");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const transfer_service_1 = require("./services/transfer.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
// WEBSOCKET - Socket.IO setup
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_1.env.FRONTEND_URL,
        credentials: true,
    },
});
exports.io = io;
// Authenticate Socket.IO connections
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true },
        });
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }
        // Attach user to socket
        socket.data.userId = user.id;
        socket.data.email = user.email;
        // Join user's room
        socket.join(`user:${user.id}`);
        logger_1.logger.info(`WebSocket connected: user ${user.email}`);
        next();
    }
    catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});
// Socket.IO event handlers
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        logger_1.logger.info(`WebSocket disconnected: user ${socket.data.email}`);
    });
    // Ping-pong for keep-alive
    socket.on('ping', () => {
        socket.emit('pong');
    });
});
// REAL-TIME NOTIFICATIONS - Event listeners
transfer_service_1.transferEvents.on('TRANSFER_COMPLETED', (data) => {
    // Notify sender - balance updated
    io.to(`user:${data.senderId}`).emit('balance:updated', {
        newBalance: data.senderBalance,
        timestamp: data.timestamp,
    });
    // Notify receiver - new transaction
    io.to(`user:${data.receiverId}`).emit('transaction:new', {
        transaction: {
            id: data.transactionId,
            amount: data.amount,
            type: 'CREDIT',
            senderId: data.senderId,
        },
        newBalance: data.receiverBalance,
        timestamp: data.timestamp,
    });
    logger_1.logger.debug(`WebSocket notifications sent for transaction ${data.transactionId}`);
});
// Security middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL,
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use((req, _res, next) => {
    logger_1.logger.http(`${req.method} ${req.path}`);
    next();
});
// API routes
app.use('/api', routes_1.default);
// 404 handler
app.use(error_middleware_1.notFound);
// Global error handler (must be last)
app.use(error_middleware_1.errorHandler);
// Start server
const PORT = env_1.env.PORT;
httpServer.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server running on port ${PORT}`);
    logger_1.logger.info(`📝 Environment: ${env_1.env.NODE_ENV}`);
    logger_1.logger.info(`🌐 Frontend URL: ${env_1.env.FRONTEND_URL}`);
    logger_1.logger.info(`💾 Database connected`);
});
// Graceful shutdown
const gracefulShutdown = async () => {
    logger_1.logger.info('Shutting down gracefully...');
    // Close HTTP server
    httpServer.close(async () => {
        logger_1.logger.info('HTTP server closed');
        // Disconnect Prisma
        await database_1.prisma.$disconnect();
        logger_1.logger.info('Database disconnected');
        process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection:', reason);
    throw reason;
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map