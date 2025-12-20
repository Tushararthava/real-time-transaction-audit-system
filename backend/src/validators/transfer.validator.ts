'use strict';

import { z } from 'zod';

export const transferSchema = z.object({
    body: z.object({
        receiverId: z.string().uuid('Invalid receiver ID'),
        amount: z.number().int().positive('Amount must be a positive integer'),
        description: z.string().max(200, 'Description must not exceed 200 characters').optional(),
    }),
});

export const transactionQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        type: z.enum(['DEBIT', 'CREDIT']).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }),
});
