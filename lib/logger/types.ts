/**
 * Logging System Types
 * ประเภทข้อมูลสำหรับระบบ Logging
 */

import {
  AuditAction,
  LogSeverity,
  SecurityEventType,
} from "@/lib/db";

// ==========================================
// Common Types
// ==========================================

export interface RequestContext {
  requestId?: string;
  sessionId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
}

// ==========================================
// Application Logger Types
// ==========================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp?: Date;
  module?: string;
  functionName?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  filePath?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
  sensitiveFields: string[];
}

// ==========================================
// Audit Logger Types
// ==========================================

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changedFields?: string[];
  module?: string;
  success?: boolean;
  errorMessage?: string;
  duration?: number;
}

export interface AuditLogCreateInput extends AuditLogEntry {
  context: RequestContext;
}

// Entity types that should be audited
export type AuditableEntity =
  | "Sale"
  | "Customer"
  | "CreditLimit"
  | "TemporaryCreditLimit"
  | "User"
  | "Role"
  | "Permission"
  | "Product"
  | "Employee"
  | "Company"
  | "Department"
  | "Position";

// Actions that require audit logging
export const AUDITABLE_ACTIONS: Record<AuditableEntity, AuditAction[]> = {
  Sale: ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT"],
  Customer: ["CREATE", "UPDATE", "DELETE"],
  CreditLimit: ["CREATE", "UPDATE", "DELETE", "VIEW"],
  TemporaryCreditLimit: ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT"],
  User: ["CREATE", "UPDATE", "DELETE"],
  Role: ["CREATE", "UPDATE", "DELETE"],
  Permission: ["CREATE", "UPDATE", "DELETE"],
  Product: ["CREATE", "UPDATE", "DELETE"],
  Employee: ["CREATE", "UPDATE", "DELETE"],
  Company: ["CREATE", "UPDATE", "DELETE"],
  Department: ["CREATE", "UPDATE", "DELETE"],
  Position: ["CREATE", "UPDATE", "DELETE"],
};

// ==========================================
// Security Logger Types
// ==========================================

export interface SecurityLogEntry {
  eventType: SecurityEventType;
  severity?: LogSeverity;
  message?: string;
  ipAddress: string;
  userAgent?: string;
  geoLocation?: string;
  details?: Record<string, unknown>;
  targetUserId?: string;
  targetUserEmail?: string;
  success?: boolean;
  failureReason?: string;
  riskScore?: number;
  isBlocked?: boolean;
  attemptCount?: number;
}

export interface SecurityLogCreateInput extends SecurityLogEntry {
  context: Partial<RequestContext>;
}

// Events that require security logging
export const SECURITY_EVENTS_CONFIG: Record<
  SecurityEventType,
  { severity: LogSeverity; shouldAlert: boolean }
> = {
  LOGIN_SUCCESS: { severity: "INFO", shouldAlert: false },
  LOGIN_FAILED: { severity: "WARN", shouldAlert: false },
  LOGOUT: { severity: "INFO", shouldAlert: false },
  PASSWORD_CHANGE: { severity: "WARN", shouldAlert: true },
  PASSWORD_RESET: { severity: "WARN", shouldAlert: true },
  PERMISSION_CHANGE: { severity: "CRITICAL", shouldAlert: true },
  ROLE_CHANGE: { severity: "CRITICAL", shouldAlert: true },
  ADMIN_ACTION: { severity: "CRITICAL", shouldAlert: true },
  DATA_EXPORT: { severity: "WARN", shouldAlert: true },
  SUSPICIOUS_ACTIVITY: { severity: "CRITICAL", shouldAlert: true },
  SESSION_EXPIRED: { severity: "INFO", shouldAlert: false },
  ACCOUNT_LOCKED: { severity: "WARN", shouldAlert: true },
  ACCOUNT_UNLOCKED: { severity: "INFO", shouldAlert: true },
};

// ==========================================
// Sensitive Data Configuration
// ==========================================

export const SENSITIVE_FIELDS = [
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
] as const;

// Fields that should be partially masked (show first/last chars)
export const PARTIAL_MASK_FIELDS = ["email", "phone", "mobile"] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];
export type PartialMaskField = (typeof PARTIAL_MASK_FIELDS)[number];
