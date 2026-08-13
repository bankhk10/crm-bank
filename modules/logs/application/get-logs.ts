import { AuditLogFilter, SecurityLogFilter, AppLogFilter } from "../types";
import * as repo from "../infrastructure/logs.repository";

// ==========================================
// Audit Logs
// ==========================================

export async function getAuditLogsUseCase(filter: AuditLogFilter = {}) {
  return repo.findAuditLogs(filter);
}

export async function getAuditLogByIdUseCase(id: string) {
  return repo.findAuditLogById(id);
}

export async function getEntityAuditHistoryUseCase(
  entityType: string,
  entityId: string,
) {
  return repo.findEntityAuditHistory(entityType, entityId);
}

// ==========================================
// Security Logs
// ==========================================

export async function getSecurityLogsUseCase(filter: SecurityLogFilter = {}) {
  return repo.findSecurityLogs(filter);
}

export async function getHighRiskEventsUseCase(
  minScore: number = 60,
  limit: number = 20,
) {
  return repo.findHighRiskEvents(minScore, limit);
}

export async function getLoginHistoryUseCase(
  userId: string,
  limit: number = 50,
) {
  return repo.findLoginHistory(userId, limit);
}

export async function getSecurityLogByIdUseCase(id: string) {
  return repo.findSecurityLogById(id);
}

// ==========================================
// Application Logs
// ==========================================

export async function getApplicationLogsUseCase(filter: AppLogFilter = {}) {
  return repo.findApplicationLogs(filter);
}

export async function getErrorLogsUseCase(limit: number = 50) {
  return repo.findErrorLogs(limit);
}

export async function getApplicationLogByIdUseCase(id: string) {
  return repo.findApplicationLogById(id);
}

// ==========================================
// Generic Log Detail Lookup
// ==========================================

export async function getLogDetailUseCase(id: string, type?: string) {
  if (type === "audit") {
    const log = await repo.findAuditLogById(id);
    if (log) return { log, type: "audit" as const };
  } else if (type === "security") {
    const log = await repo.findSecurityLogById(id);
    if (log) return { log, type: "security" as const };
  } else if (type === "application") {
    const log = await repo.findApplicationLogById(id);
    if (log) return { log, type: "application" as const };
  }

  // Fallback search if type is not specified or log not found in specified type
  const auditLog = await repo.findAuditLogById(id);
  if (auditLog) return { log: auditLog, type: "audit" as const };

  const securityLog = await repo.findSecurityLogById(id);
  if (securityLog) return { log: securityLog, type: "security" as const };

  const appLog = await repo.findApplicationLogById(id);
  if (appLog) return { log: appLog, type: "application" as const };

  return null;
}

// ==========================================
// Statistics
// ==========================================

export async function getLogStatisticsUseCase() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalAuditLogs,
    todayAuditLogs,
    totalSecurityLogs,
    todaySecurityLogs,
    highRiskEvents,
    failedLogins,
    recentErrors,
  ] = await Promise.all([
    repo.countAuditLogs(),
    repo.countAuditLogs({ timestamp: { gte: today } }),
    repo.countSecurityLogs(),
    repo.countSecurityLogs({ timestamp: { gte: today } }),
    repo.countSecurityLogs({ riskScore: { gte: 60 } }),
    repo.countSecurityLogs({
      eventType: "LOGIN_FAILED",
      timestamp: { gte: weekAgo },
    }),
    repo.countApplicationLogs({
      level: { in: ["ERROR", "CRITICAL"] },
      timestamp: { gte: weekAgo },
    }),
  ]);

  return {
    auditLogs: { total: totalAuditLogs, today: todayAuditLogs },
    securityLogs: { total: totalSecurityLogs, today: todaySecurityLogs },
    highRiskEvents,
    failedLoginsThisWeek: failedLogins,
    errorsThisWeek: recentErrors,
  };
}

// ==========================================
// Audit Log Actions by Entity
// ==========================================

export async function getAuditLogsByEntityTypeUseCase() {
  const results = await repo.groupAuditLogsByEntityType();
  return results.map((r) => ({
    entityType: r.entityType,
    count: r._count,
  }));
}

export async function getSecurityEventsByTypeUseCase() {
  const results = await repo.groupSecurityEventsByType();
  return results.map((r) => ({
    eventType: r.eventType,
    count: r._count,
  }));
}
