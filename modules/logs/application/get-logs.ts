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

// ==========================================
// Application Logs
// ==========================================

export async function getApplicationLogsUseCase(filter: AppLogFilter = {}) {
  return repo.findApplicationLogs(filter);
}

export async function getErrorLogsUseCase(limit: number = 50) {
  return repo.findErrorLogs(limit);
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
