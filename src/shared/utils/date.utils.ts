/**
 * Date Utility Functions
 * Provides consistent date formatting across the application
 */

/**
 * Formats a date as a readable string in Thai format.
 *
 * @param input - A date string or timestamp to format.
 * @returns A string formatted in Thai locale with Buddhist Era.
 */
export function formatDate(input: Date | string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a date as short format in Thai.
 *
 * @param input - A date string or timestamp to format.
 * @returns A string formatted as DD/MM/YYYY in Thai locale.
 */
export function formatDateShort(input: Date | string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Formats a date and time as a readable string in Thai format.
 *
 * @param input - A date string or timestamp to format.
 * @returns A string formatted in Thai locale with Buddhist Era and 24-hour time.
 */
export function formatDateTime(input: Date | string | number): string {
  const date = new Date(input);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Formats time only.
 *
 * @param input - A date string or timestamp to format.
 * @returns A string formatted as HH:MM.
 */
export function formatTime(input: Date | string | number): string {
  const date = new Date(input);
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Add days to a date.
 *
 * @param date - The starting date.
 * @param days - Number of days to add.
 * @returns New date with days added.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if a date is in the past.
 *
 * @param date - The date to check.
 * @returns True if the date is before now.
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if a date is today.
 *
 * @param date - The date to check.
 * @returns True if the date is today.
 */
export function isToday(date: Date | string | number): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of day.
 *
 * @param date - The input date.
 * @returns Date set to 00:00:00.000.
 */
export function startOfDay(date: Date | string | number): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day.
 *
 * @param date - The input date.
 * @returns Date set to 23:59:59.999.
 */
export function endOfDay(date: Date | string | number): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Calculate difference in days between two dates.
 *
 * @param date1 - First date.
 * @param date2 - Second date.
 * @returns Number of days difference.
 */
export function diffInDays(
  date1: Date | string | number,
  date2: Date | string | number
): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
