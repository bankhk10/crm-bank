import {
  AuditAction,
  LogSeverity,
  SecurityEventType,
} from "@/src/infrastructure/database";

export interface AuditLogFilter {
  entityType?: string;
  action?: AuditAction;
  userId?: string;
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
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
