'use strict';

import { PrismaClient } from '@prisma/client';

// Global Prisma Client instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ],
    });

// Log queries in development
if (process.env.NODE_ENV === 'development') {
    // Lazy import to avoid circular dependency and initialization order issues
    import('../config/logger').then(({ logger }) => {
        prisma.$on('query' as never, (e: any) => {
            logger.debug(`Query: ${e.query}`);
            logger.debug(`Duration: ${e.duration}ms`);
        });
    });
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
