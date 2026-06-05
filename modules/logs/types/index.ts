import type {
  AuditAction,
  LogSeverity,
  SecurityEventType,
} from "@prisma/client";

export interface AuditLogFilter {
  entityType?: string;
  action?: AuditAction;
  userId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityLogFilter {
  eventType?: SecurityEventType;
  severity?: LogSeverity;
  userId?: string;
  ipAddress?: string;
  search?: string;
  minRiskScore?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AppLogFilter {
  level?: LogSeverity;
  module?: string;
  requestId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  auditLogs: { total: number; today: number };
  securityLogs: { total: number; today: number };
  highRiskEvents: number;
  failedLoginsThisWeek: number;
  errorsThisWeek: number;
}

export type LogEntry = Record<string, any>;
