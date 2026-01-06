import { z } from 'zod';
export declare const transferSchema: z.ZodObject<{
    body: z.ZodObject<{
        receiverId: z.ZodString;
        amount: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        receiverId: string;
        description?: string | undefined;
    }, {
        amount: number;
        receiverId: string;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        amount: number;
        receiverId: string;
        description?: string | undefined;
    };
}, {
    body: {
        amount: number;
        receiverId: string;
        description?: string | undefined;
    };
}>;
export declare const transactionQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        type: z.ZodOptional<z.ZodEnum<["DEBIT", "CREDIT"]>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: "DEBIT" | "CREDIT" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        type?: "DEBIT" | "CREDIT" | undefined;
        limit?: string | undefined;
        page?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        type?: "DEBIT" | "CREDIT" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    };
}, {
    query: {
        type?: "DEBIT" | "CREDIT" | undefined;
        limit?: string | undefined;
        page?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    };
}>;
//# sourceMappingURL=transfer.validator.d.ts.map