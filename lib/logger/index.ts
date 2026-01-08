/**
 * Logging System - Main Export
 * ส่งออก Logger ทั้งหมด
 */

// Export main loggers
export { logger, ApplicationLogger } from "./app-logger";
export { auditLogger, AuditLogger } from "./audit-logger";
export { securityLogger, SecurityLogger } from "./security-logger";

// Export middleware
export {
  createRequestContext,
  withLogging,
  createActionLogger,
  withActionLogging,
} from "./middleware";

// Export types
export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  RequestContext,
  AuditLogEntry,
  AuditLogCreateInput,
  AuditableEntity,
  SecurityLogEntry,
  SecurityLogCreateInput,
} from "./types";

// Export utilities
export {
  generateRequestId,
  generateSessionId,
  maskSensitiveData,
  partialMask,
  getChangedFields,
  safeStringify,
  extractClientIp,
  extractUserAgent,
  calculateRiskScore,
  formatDuration,
} from "./utils";

// Export config
export { getLoggerConfig, LOG_RETENTION, SECURITY_RATE_LIMITS } from "./config";

// Export constants
export {
  AUDITABLE_ACTIONS,
  SECURITY_EVENTS_CONFIG,
  SENSITIVE_FIELDS,
} from "./types";
