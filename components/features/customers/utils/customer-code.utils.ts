/**
 * Customer Code Utilities
 * Helper functions for customer code generation and validation
 */

/**
 * Generate a fallback customer code based on timestamp
 */
export function generateFallbackCode(): string {
  return `C${String(Date.now()).slice(-5)}`;
}

/**
 * Validate customer code format (e.g., C00001)
 */
export function isValidCustomerCode(code: string): boolean {
  return /^C\d{5,}$/.test(code);
}

/**
 * Format customer code with leading zeros
 */
export function formatCustomerCode(number: number, prefix = "C"): string {
  return `${prefix}${String(number).padStart(5, "0")}`;
}
