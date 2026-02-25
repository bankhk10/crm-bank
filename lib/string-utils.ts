/**
 * String Utility Functions
 * Provides common string manipulation functions
 */

/**
 * Extracts initials from a given name.
 */
export function getInitials(
  name: string | null | undefined,
  count?: number,
): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase());

  return count && count > 0
    ? initials.slice(0, count).join("")
    : initials.join("");
}

/**
 * Generates a URL-friendly slug from a given title.
 */
export function getSlug(title: string): string {
  if (!title || typeof title !== "string") {
    return "";
  }

  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Truncates a string to a maximum length.
 */
export function truncate(
  text: string,
  maxLength: number,
  suffix: string = "...",
): string {
  if (!text || text.length <= maxLength) {
    return text || "";
  }
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word.
 */
export function titleCase(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Removes extra whitespace from a string.
 */
export function cleanWhitespace(text: string): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Checks if a string is empty or only whitespace.
 */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Generates a unique identifier.
 */
export function uid(): string {
  return (Date.now() + Math.floor(Math.random() * 1000)).toString();
}

/**
 * Masks a string, showing only first and last characters.
 */
export function mask(
  text: string,
  visibleStart: number = 2,
  visibleEnd: number = 2,
  maskChar: string = "*",
): string {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return text || "";
  }

  const start = text.slice(0, visibleStart);
  const end = text.slice(-visibleEnd);
  const middle = maskChar.repeat(text.length - visibleStart - visibleEnd);

  return start + middle + end;
}
