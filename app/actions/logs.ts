"use server";

/**
 * Log Viewer Server Actions
 * Server Actions สำหรับดึงข้อมูล logs
 */

import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";
import {
  AuditAction,
  LogSeverity,
  SecurityEventType,
} from "@/src/infrastructure/database";

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

export interface AuditLogFilter {
  entityType?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(filter: AuditLogFilter = {}) {
  await requireAdminAccess();

  const {
    entityType,
    action,
    userId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(action && { action }),
      ...(userId && { userId }),
      ...((startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.auditLog.count({
    where: {
      ...(entityType && { entityType }),
      ...(action && { action }),
      ...(userId && { userId }),
      ...((startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
  });

  return { logs, total };
}

export async function getAuditLogById(id: string) {
  await requireAdminAccess();

  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getEntityAuditHistory(
  entityType: string,
  entityId: string
) {
  await requireAdminAccess();

  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

// ==========================================
// Security Logs
// ==========================================

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

export async function getSecurityLogs(filter: SecurityLogFilter = {}) {
  await requireAdminAccess();

  const {
    eventType,
    severity,
    userId,
    ipAddress,
    minRiskScore,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter;

  const logs = await prisma.securityLog.findMany({
    where: {
      ...(eventType && { eventType }),
      ...(severity && { severity }),
      ...(userId && { userId }),
      ...(ipAddress && { ipAddress }),
      ...(minRiskScore && { riskScore: { gte: minRiskScore } }),
      ...((startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.securityLog.count({
    where: {
      ...(eventType && { eventType }),
      ...(severity && { severity }),
      ...(userId && { userId }),
      ...(ipAddress && { ipAddress }),
      ...(minRiskScore && { riskScore: { gte: minRiskScore } }),
      ...((startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
  });

  return { logs, total };
}

export async function getHighRiskEvents(
  minScore: number = 60,
  limit: number = 20
) {
  await requireAdminAccess();

  return prisma.securityLog.findMany({
    where: {
      riskScore: { gte: minScore },
    },
    orderBy: [{ riskScore: "desc" }, { timestamp: "desc" }],
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getLoginHistory(userId: string, limit: number = 50) {
  await requireAdminAccess();

  return prisma.securityLog.findMany({
    where: {
      userId,
      eventType: {
        in: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT"],
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

// ==========================================
// Application Logs
// ==========================================

export interface AppLogFilter {
  level?: LogSeverity;
  module?: string;
  requestId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function getApplicationLogs(filter: AppLogFilter = {}) {
  await requireAdminAccess();

  const {
    level,
    module,
    requestId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filter;

  const logs = await prisma.applicationLog.findMany({
    where: {
      ...(level && { level }),
      ...(module && { module }),
      ...(requestId && { requestId }),
      ...((startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
    skip: offset,
  });

  const total = await prisma.applicationLog.count({
    where: {
      ...(level && { level }),
      ...(module && { module }),
      ...(requestId && { requestId }),
      ...((startDate || endDate) && {
        timestamp: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
  });

  return { logs, total };
}

export async function getErrorLogs(limit: number = 50) {
  await requireAdminAccess();

  return prisma.applicationLog.findMany({
    where: {
      level: {
        in: ["ERROR", "CRITICAL"],
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

// ==========================================
// Statistics
// ==========================================

export async function getLogStatistics() {
  await requireAdminAccess();

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
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: today } } }),
    prisma.securityLog.count(),
    prisma.securityLog.count({ where: { timestamp: { gte: today } } }),
    prisma.securityLog.count({ where: { riskScore: { gte: 60 } } }),
    prisma.securityLog.count({
      where: {
        eventType: "LOGIN_FAILED",
        timestamp: { gte: weekAgo },
      },
    }),
    prisma.applicationLog.count({
      where: {
        level: { in: ["ERROR", "CRITICAL"] },
        timestamp: { gte: weekAgo },
      },
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

export async function getAuditLogsByEntityType() {
  await requireAdminAccess();

  const results = await prisma.auditLog.groupBy({
    by: ["entityType"],
    _count: true,
    orderBy: {
      _count: {
        entityType: "desc",
      },
    },
  });

  return results.map((r) => ({
    entityType: r.entityType,
    count: r._count,
  }));
}

export async function getSecurityEventsByType() {
  await requireAdminAccess();

  const results = await prisma.securityLog.groupBy({
    by: ["eventType"],
    _count: true,
    orderBy: {
      _count: {
        eventType: "desc",
      },
    },
  });

  return results.map((r) => ({
    eventType: r.eventType,
    count: r._count,
  }));
}
