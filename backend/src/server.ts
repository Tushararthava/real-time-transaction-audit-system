'use strict';

import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { transferEvents } from './services/transfer.service';
import jwt from 'jsonwebtoken';


const app: Application = express();

// Trust proxy (Required for Railway/Heroku/Vercel)
app.set('trust proxy', 1);

const httpServer = createServer(app);

// WEBSOCKET - Socket.IO setup
const io = new SocketServer(httpServer, {
    cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
    },
});

// Authenticate Socket.IO connections
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }


        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };


        const user = await prisma.user.findUnique({
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

        logger.info(`WebSocket connected: user ${user.email}`);
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.IO event handlers
io.on('connection', (socket) => {

    socket.on('disconnect', () => {
        logger.info(`WebSocket disconnected: user ${socket.data.email}`);
    });

    // Ping-pong for keep-alive
    socket.on('ping', () => {
        socket.emit('pong');
    });
});

// REAL-TIME NOTIFICATIONS - Event listeners
transferEvents.on('TRANSFER_COMPLETED', (data) => {
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

    logger.debug(`WebSocket notifications sent for transaction ${data.transactionId}`);
});

// Security middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = env.PORT;

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Start server with programmatic migration check
const startServer = async () => {
    try {
        if (env.NODE_ENV === 'production') {
            logger.info('🚀 Running database migrations...');
            await execAsync('npx prisma migrate deploy');
            logger.info('✅ Database migrations applied successfully');
        }
    } catch (error) {
        logger.error('❌ Migration failed:', error);
        // Continue anyway - maybe migrations are already done or it's a soft error
    }

    httpServer.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📝 Environment: ${env.NODE_ENV}`);
        logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
        logger.info(`💾 Database connected`);
    });
};

startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Shutting down gracefully...');

    // Close HTTP server
    httpServer.close(async () => {
        logger.info('HTTP server closed');

        // Disconnect Prisma
        await prisma.$disconnect();
        logger.info('Database disconnected');

        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    throw reason;
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export { app, io };
