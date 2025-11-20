import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random booking ID
 * Format: CK-{timestamp}
 * Example: CK-1704123456789
 */
export function generateRandomId(): string {
  return `CK-${Date.now()}`;
}

/**
 * Check if payment gateway is enabled
 * Reads from NEXT_PUBLIC_ENABLE_PG environment variable
 */
export function getPGIntegration(): boolean {
  const isIntegrated = process.env.NEXT_PUBLIC_ENABLE_PG;
  return isIntegrated === "true";
} 