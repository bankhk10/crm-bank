export function safeRedirect(url: string | undefined, defaultPath = "/") {
  if (!url) return defaultPath;
  try {
    // decode in case callers pass encoded values
    const decoded = decodeURIComponent(url);

    // Only allow relative paths that start with '/'
    if (decoded.startsWith("/")) return decoded;

    // Allow same-origin absolute URLs (optional) - whitelist hosts
    const allowedHosts = ["localhost:3000", "127.0.0.1:3000", "yourdomain.com"];
    const parsed = new URL(decoded);
    if (allowedHosts.includes(parsed.host)) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (e) {
    // If parsing fails, fall through to default
  }

  return defaultPath;
}
