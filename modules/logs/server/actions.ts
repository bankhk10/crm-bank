"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { AuditLogFilter, SecurityLogFilter, AppLogFilter } from "../types";
import * as application from "../application";

// Permission check helper
async function requireAdminAccess(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const isAdmin =
    session.user.roles?.includes("administrator") ||
    session.user.roles?.includes("admin") ||
    session.user.permissionKeys?.includes("logs.view");

  if (!isAdmin) {
    throw new Error("Access denied: Admin role required");
  }
}

// ==========================================
// Audit Logs
// ==========================================

export async function getAuditLogsAction(filter: AuditLogFilter = {}) {
  await requireAdminAccess();
  return application.getAuditLogsUseCase(filter);
}

export async function getAuditLogByIdAction(id: string) {
  await requireAdminAccess();
  return application.getAuditLogByIdUseCase(id);
}

export async function getLogDetailAction(id: string, type?: string) {
  await requireAdminAccess();
  return application.getLogDetailUseCase(id, type);
}

export async function getEntityAuditHistoryAction(
  entityType: string,
  entityId: string,
) {
  await requireAdminAccess();
  return application.getEntityAuditHistoryUseCase(entityType, entityId);
}

// ==========================================
// Security Logs
// ==========================================

export async function getSecurityLogsAction(filter: SecurityLogFilter = {}) {
  await requireAdminAccess();
  return application.getSecurityLogsUseCase(filter);
}

export async function getHighRiskEventsAction(
  minScore: number = 60,
  limit: number = 20,
) {
  await requireAdminAccess();
  return application.getHighRiskEventsUseCase(minScore, limit);
}

export async function getLoginHistoryAction(
  userId: string,
  limit: number = 50,
) {
  await requireAdminAccess();
  return application.getLoginHistoryUseCase(userId, limit);
}

// ==========================================
// Application Logs
// ==========================================

export async function getApplicationLogsAction(filter: AppLogFilter = {}) {
  await requireAdminAccess();
  return application.getApplicationLogsUseCase(filter);
}

export async function getErrorLogsAction(limit: number = 50) {
  await requireAdminAccess();
  return application.getErrorLogsUseCase(limit);
}

// ==========================================
// Statistics
// ==========================================

export async function getLogStatisticsAction() {
  await requireAdminAccess();
  return application.getLogStatisticsUseCase();
}

// ==========================================
// Audit Log Actions by Entity
// ==========================================

export async function getAuditLogsByEntityTypeAction() {
  await requireAdminAccess();
  return application.getAuditLogsByEntityTypeUseCase();
}

export async function getSecurityEventsByTypeAction() {
  await requireAdminAccess();
  return application.getSecurityEventsByTypeUseCase();
}

