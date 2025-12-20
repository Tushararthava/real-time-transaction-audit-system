import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format amount in cents to currency string
 * @param amount Amount in cents
 * @returns Formatted currency string (e.g., "₹50.00")
 */
export function formatCurrency(amount: number): string {
    return `₹${(amount / 100).toFixed(2)}`;
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
