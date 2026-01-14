/**
 * String Utility Functions
 * Provides common string manipulation functions
 */

/**
 * Extracts initials from a given name.
 *
 * @param name - The full name to extract initials from.
 * @param count - The number of initials to return. Defaults to all initials.
 * @returns A string of initials from the name.
 */
export function getInitials(
  name: string | null | undefined,
  count?: number
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
 *
 * @param title - The title to convert into a slug.
 * @returns A slug string.
 */
export function getSlug(title: string): string {
  if (!title || typeof title !== "string") {
    return "";
  }

  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replaceAll(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Truncates a string to a maximum length.
 *
 * @param text - The text to truncate.
 * @param maxLength - Maximum length before truncation.
 * @param suffix - Suffix to add when truncated. Defaults to "...".
 * @returns The truncated string.
 */
export function truncate(
  text: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (!text || text.length <= maxLength) {
    return text || "";
  }
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param text - The text to capitalize.
 * @returns The capitalized string.
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word.
 *
 * @param text - The text to transform.
 * @returns The title-cased string.
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
 *
 * @param text - The text to clean.
 * @returns The cleaned string.
 */
export function cleanWhitespace(text: string): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Checks if a string is empty or only whitespace.
 *
 * @param text - The text to check.
 * @returns True if empty or whitespace only.
 */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Generates a unique identifier.
 *
 * @returns A unique ID string.
 */
export function uid(): string {
  return (Date.now() + Math.floor(Math.random() * 1000)).toString();
}

/**
 * Masks a string, showing only first and last characters.
 *
 * @param text - The text to mask.
 * @param visibleStart - Number of visible characters at start. Defaults to 2.
 * @param visibleEnd - Number of visible characters at end. Defaults to 2.
 * @param maskChar - Character to use for masking. Defaults to "*".
 * @returns The masked string.
 */
export function mask(
  text: string,
  visibleStart: number = 2,
  visibleEnd: number = 2,
  maskChar: string = "*"
): string {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return text || "";
  }

  const start = text.slice(0, visibleStart);
  const end = text.slice(-visibleEnd);
  const middle = maskChar.repeat(text.length - visibleStart - visibleEnd);

  return start + middle + end;
}
