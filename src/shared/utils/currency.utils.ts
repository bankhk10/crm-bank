/**
 * Currency Utility Functions
 * Provides consistent currency formatting across the application
 */

/**
 * Formats a number as a currency string in Thai Baht.
 *
 * @param amount - The numeric value to format as currency.
 * @param currency - The currency code (e.g., "THB", "USD"). Defaults to "THB".
 * @param locale - The locale for formatting (e.g., "th-TH"). Defaults to "th-TH".
 * @returns A string formatted as currency.
 */
export function formatCurrency(
  amount: number,
  currency: string = "THB",
  locale: string = "th-TH"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats a number with thousand separators.
 *
 * @param amount - The numeric value to format.
 * @param locale - The locale for formatting. Defaults to "th-TH".
 * @returns A string formatted with thousand separators.
 */
export function formatNumber(amount: number, locale: string = "th-TH"): string {
  return new Intl.NumberFormat(locale).format(amount);
}

/**
 * Formats a number as a percentage.
 *
 * @param value - The numeric value (0-1 or 0-100).
 * @param decimals - Number of decimal places. Defaults to 2.
 * @param isDecimal - Whether the value is already decimal (0-1). Defaults to false.
 * @returns A string formatted as percentage.
 */
export function formatPercent(
  value: number,
  decimals: number = 2,
  isDecimal: boolean = false
): string {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Parses a currency string to a number.
 *
 * @param value - The currency string to parse.
 * @returns The numeric value.
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[฿$€£,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Rounds a number to specified decimal places.
 *
 * @param value - The numeric value to round.
 * @param decimals - Number of decimal places. Defaults to 2.
 * @returns The rounded number.
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates percentage of a value.
 *
 * @param value - The base value.
 * @param percentage - The percentage to calculate.
 * @returns The calculated amount.
 */
export function calculatePercent(value: number, percentage: number): number {
  return roundTo((value * percentage) / 100, 2);
}
