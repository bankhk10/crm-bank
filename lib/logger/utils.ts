/**
 * Logger Utility Functions
 * ฟังก์ชันช่วยสำหรับระบบ Logging
 */

import { PARTIAL_MASK_FIELDS, SENSITIVE_FIELDS } from "./types";

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${randomPart}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${randomPart}`;
}

/**
 * Mask sensitive data in an object
 * @param data - Object containing potentially sensitive data
 * @returns Object with sensitive fields masked
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T
): T {
  if (!data || typeof data !== "object") {
    return data;
  }

  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    const value = masked[key];

    // Check if field should be completely masked
    if (
      SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))
    ) {
      masked[key] = "[REDACTED]" as T[Extract<keyof T, string>];
      continue;
    }

    // Check if field should be partially masked
    if (
      PARTIAL_MASK_FIELDS.some((field) =>
        lowerKey.includes(field.toLowerCase())
      )
    ) {
      if (typeof value === "string") {
        masked[key] = partialMask(value, lowerKey) as T[Extract<
          keyof T,
          string
        >];
        continue;
      }
    }

    // Recursively mask nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      masked[key] = maskSensitiveData(
        value as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    }

    // Mask arrays of objects
    if (Array.isArray(value)) {
      masked[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? maskSensitiveData(item as Record<string, unknown>)
          : item
      ) as T[Extract<keyof T, string>];
    }
  }

  return masked;
}

/**
 * Partially mask a string value
 * @param value - String to mask
 * @param fieldType - Type of field (email, phone, etc.)
 * @returns Partially masked string
 */
export function partialMask(value: string, fieldType: string): string {
  if (!value || value.length < 4) {
    return "***";
  }

  // Email masking: a***@example.com
  if (fieldType.includes("email")) {
    const atIndex = value.indexOf("@");
    if (atIndex > 1) {
      const local = value.substring(0, atIndex);
      const domain = value.substring(atIndex);
      const maskedLocal =
        local[0] + "***" + (local.length > 2 ? local.slice(-1) : "");
      return maskedLocal + domain;
    }
    return value[0] + "***";
  }

  // Phone masking: 08***1234
  if (fieldType.includes("phone") || fieldType.includes("mobile")) {
    if (value.length >= 8) {
      return value.substring(0, 2) + "***" + value.slice(-4);
    }
    return value.substring(0, 2) + "***";
  }

  // Default partial masking
  const visibleChars = Math.min(2, Math.floor(value.length / 4));
  return value.substring(0, visibleChars) + "***" + value.slice(-visibleChars);
}

/**
 * Calculate the differences between two objects
 * @param oldObj - Original object
 * @param newObj - New object
 * @returns Array of changed field names
 */
export function getChangedFields(
  oldObj: Record<string, unknown> | null | undefined,
  newObj: Record<string, unknown> | null | undefined
): string[] {
  if (!oldObj || !newObj) {
    return [];
  }

  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Skip if both are undefined
    if (oldValue === undefined && newValue === undefined) {
      continue;
    }

    // Check for changes
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

/**
 * Safely serialize an object to JSON
 * @param obj - Object to serialize
 * @returns JSON string or error message
 */
export function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_, value) => {
      // Handle BigInt
      if (typeof value === "bigint") {
        return value.toString();
      }
      // Handle circular references
      if (typeof value === "object" && value !== null) {
        const seen = new WeakSet();
        return JSON.parse(
          JSON.stringify(value, (_, v) => {
            if (typeof v === "object" && v !== null) {
              if (seen.has(v)) {
                return "[Circular]";
              }
              seen.add(v);
            }
            return v;
          })
        );
      }
      return value;
    });
  } catch {
    return "[Serialization Error]";
  }
}

/**
 * Extract client IP address from request headers
 * @param headers - Request headers
 * @returns Client IP address
 */
export function extractClientIp(
  headers: Headers | Record<string, string | string[] | undefined>
): string {
  // Check common headers for client IP
  const headerKeys = [
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip", // Cloudflare
    "true-client-ip",
  ];

  for (const key of headerKeys) {
    let value: string | undefined;

    if (headers instanceof Headers) {
      value = headers.get(key) || undefined;
    } else {
      const headerValue = headers[key];
      value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    }

    if (value) {
      // x-forwarded-for may contain multiple IPs, take the first one
      return value.split(",")[0].trim();
    }
  }

  return "unknown";
}

/**
 * Extract user agent from request headers
 * @param headers - Request headers
 * @returns User agent string
 */
export function extractUserAgent(
  headers: Headers | Record<string, string | string[] | undefined>
): string {
  if (headers instanceof Headers) {
    return headers.get("user-agent") || "unknown";
  }

  const userAgent = headers["user-agent"];
  return (Array.isArray(userAgent) ? userAgent[0] : userAgent) || "unknown";
}

/**
 * Calculate risk score based on security event
 * @param eventType - Type of security event
 * @param attemptCount - Number of failed attempts
 * @param isSuccess - Whether the action was successful
 * @returns Risk score (0-100)
 */
export function calculateRiskScore(
  eventType: string,
  attemptCount: number = 1,
  isSuccess: boolean = true
): number {
  let score = 0;

  // Base score by event type
  const eventScores: Record<string, number> = {
    LOGIN_SUCCESS: 0,
    LOGIN_FAILED: 20,
    LOGOUT: 0,
    PASSWORD_CHANGE: 30,
    PASSWORD_RESET: 40,
    PERMISSION_CHANGE: 50,
    ROLE_CHANGE: 50,
    ADMIN_ACTION: 40,
    DATA_EXPORT: 30,
    SUSPICIOUS_ACTIVITY: 80,
    SESSION_EXPIRED: 0,
    ACCOUNT_LOCKED: 60,
    ACCOUNT_UNLOCKED: 20,
  };

  score = eventScores[eventType] || 10;

  // Increase score for repeated failures
  if (!isSuccess && attemptCount > 1) {
    score += Math.min(attemptCount * 10, 40);
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Format duration in human-readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}
