/**
 * Currency Utility Functions
 * Provides consistent currency formatting across the application
 */

/**
 * Formats a number as a currency string in Thai Baht.
 */
export function formatCurrency(
  amount: number,
  currency: string = "THB",
  locale: string = "th-TH",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats a number with thousand separators.
 */
export function formatNumber(amount: number, locale: string = "th-TH"): string {
  return new Intl.NumberFormat(locale).format(amount);
}

/**
 * Formats a number as a percentage.
 */
export function formatPercent(
  value: number,
  decimals: number = 2,
  isDecimal: boolean = false,
): string {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Parses a currency string to a number.
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[฿$€£,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Rounds a number to specified decimal places.
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates percentage of a value.
 */
export function calculatePercent(value: number, percentage: number): number {
  return roundTo((value * percentage) / 100, 2);
}
