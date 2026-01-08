/**
 * Logger Configuration
 * การตั้งค่าระบบ Logging
 */

import { LoggerConfig, LogLevel } from "./types";

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Default logger configuration
 */
export const defaultLoggerConfig: LoggerConfig = {
  level:
    (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? "debug" : "info"),
  enableConsole: isDevelopment,
  enableFile: true,
  enableDatabase: isProduction,
  filePath: process.env.LOG_FILE_PATH || "./logs",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: isDevelopment ? 7 : 30, // days
  sensitiveFields: [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "creditCard",
    "cardNumber",
    "cvv",
    "pin",
    "ssn",
    "taxId",
    "bankAccount",
    "accountNumber",
  ],
};

/**
 * Log retention configuration (in days)
 */
export const LOG_RETENTION = {
  applicationLogs: {
    debug: 7,
    info: 30,
    warn: 90,
    error: 365,
    fatal: 365,
  },
  auditLogs: 365 * 7, // 7 years for compliance
  securityLogs: 365 * 7, // 7 years for compliance
};

/**
 * Rate limiting configuration for security events
 */
export const SECURITY_RATE_LIMITS = {
  loginAttempts: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 30,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMinutes: 60,
  },
  apiRequests: {
    maxRequests: 100,
    windowMinutes: 1,
  },
};

/**
 * Modules that should have enhanced logging
 */
export const ENHANCED_LOGGING_MODULES = [
  "auth",
  "sales",
  "credit",
  "payments",
  "users",
  "permissions",
];

/**
 * Entity types that should always be audited
 */
export const ALWAYS_AUDIT_ENTITIES = [
  "Sale",
  "Customer",
  "CreditLimit",
  "TemporaryCreditLimit",
  "User",
  "Role",
  "Permission",
];

/**
 * IP addresses that should be ignored in logging (internal health checks, etc.)
 */
export const IGNORED_IPS = [
  "127.0.0.1",
  "::1",
  // Add internal health check IPs here
];

/**
 * Endpoints that should be excluded from logging
 */
export const EXCLUDED_ENDPOINTS = [
  "/api/health",
  "/api/ping",
  "/_next",
  "/favicon.ico",
];

/**
 * Get current logger configuration with environment overrides
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    ...defaultLoggerConfig,
    level: (process.env.LOG_LEVEL as LogLevel) || defaultLoggerConfig.level,
    enableConsole:
      process.env.LOG_CONSOLE === "true" || defaultLoggerConfig.enableConsole,
    enableFile: process.env.LOG_FILE !== "false",
    enableDatabase:
      process.env.LOG_DATABASE === "true" || defaultLoggerConfig.enableDatabase,
    filePath: process.env.LOG_FILE_PATH || defaultLoggerConfig.filePath,
  };
}
