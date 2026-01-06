'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionQuerySchema = exports.transferSchema = void 0;
const zod_1 = require("zod");
exports.transferSchema = zod_1.z.object({
    body: zod_1.z.object({
        receiverId: zod_1.z.string().uuid('Invalid receiver ID'),
        amount: zod_1.z.number().int().positive('Amount must be a positive integer'),
        description: zod_1.z.string().max(200, 'Description must not exceed 200 characters').optional(),
    }),
});
exports.transactionQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        type: zod_1.z.enum(['DEBIT', 'CREDIT']).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
//# sourceMappingURL=transfer.validator.js.map