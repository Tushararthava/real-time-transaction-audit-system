import { z } from 'zod';

export const transferSchema = z.object({
    receiverId: z.string().min(1, 'Please select a recipient'),
    amount: z.number().int('Amount must be a whole number')
        .positive('Amount must be greater than 0')
        .max(100000000, 'Amount is too large'), // Max 1 crore rupees in cents
    description: z.string().optional(),
});

export type TransferFormData = z.infer<typeof transferSchema>;
