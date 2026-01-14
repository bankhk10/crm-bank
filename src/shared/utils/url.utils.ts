/**
 * URL Utility Functions
 * Provides URL handling utilities
 */

/**
 * Constructs an absolute URL based on the base application URL.
 *
 * @param path - The relative path to append to the base URL.
 * @returns A string representing the absolute URL.
 */
export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

/**
 * Constructs an absolute URL for media assets.
 *
 * @param path - The relative path to the media asset.
 * @returns A string representing the absolute URL to the media asset.
 */
export function toAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/${cleanPath}`;
}

/**
 * Builds a query string from an object.
 *
 * @param params - Object with key-value pairs.
 * @returns A query string (without leading ?).
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const entries = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );

  return entries.join("&");
}

/**
 * Parses a query string into an object.
 *
 * @param queryString - The query string to parse (with or without leading ?).
 * @returns An object with key-value pairs.
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const query = queryString.startsWith("?")
    ? queryString.slice(1)
    : queryString;
  const params: Record<string, string> = {};

  if (!query) return params;

  query.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  });

  return params;
}

/**
 * Joins URL path segments.
 *
 * @param segments - URL path segments to join.
 * @returns The joined URL path.
 */
export function joinPath(...segments: string[]): string {
  return segments
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}
