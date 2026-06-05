import { db as prisma } from "@/lib/db";
import { AuditLogFilter, SecurityLogFilter, AppLogFilter } from "../types";

// ==========================================
// Audit Logs
// ==========================================

export async function findAuditLogs(filter: AuditLogFilter = {}) {
  const {
    entityType,
    action,
    userId,
    search,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter;

  const where: any = {
    ...(entityType && { entityType }),
    ...(action && { action }),
    ...(userId && { userId }),
    ...((startDate || endDate) && {
      timestamp: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  if (search) {
    where.OR = [
      { userName: { contains: search, mode: "insensitive" } },
      { userEmail: { contains: search, mode: "insensitive" } },
      { entityName: { contains: search, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const total = await prisma.auditLog.count({ where });

  return { logs, total };
}

export async function findAuditLogById(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function findEntityAuditHistory(
  entityType: string,
  entityId: string,
) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { timestamp: "desc" },
    take: 1000,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

// ==========================================
// Security Logs
// ==========================================

export async function findSecurityLogs(filter: SecurityLogFilter = {}) {
  const {
    eventType,
    severity,
    userId,
    ipAddress,
    search,
    minRiskScore,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter;

  const where: any = {
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
  };

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { ipAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.securityLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      targetUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const total = await prisma.securityLog.count({ where });

  return { logs, total };
}

export async function findHighRiskEvents(
  minScore: number = 60,
  limit: number = 20,
) {
  return prisma.securityLog.findMany({
    where: { riskScore: { gte: minScore } },
    orderBy: [{ riskScore: "desc" }, { timestamp: "desc" }],
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function findLoginHistory(userId: string, limit: number = 50) {
  return prisma.securityLog.findMany({
    where: {
      userId,
      eventType: { in: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT"] },
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

// ==========================================
// Application Logs
// ==========================================

export async function findApplicationLogs(filter: AppLogFilter = {}) {
  const {
    level,
    module,
    requestId,
    search,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filter;

  const where: any = {
    ...(level && { level }),
    ...(module && { module }),
    ...(requestId && { requestId }),
    ...((startDate || endDate) && {
      timestamp: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  if (search) {
    where.OR = [
      { message: { contains: search, mode: "insensitive" } },
      { module: { contains: search, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.applicationLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.applicationLog.count({ where });

  return { logs, total };
}

export async function findErrorLogs(limit: number = 50) {
  return prisma.applicationLog.findMany({
    where: { level: { in: ["ERROR", "CRITICAL"] } },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

// ==========================================
// Statistics
// ==========================================

export async function countAuditLogs(where: any = {}) {
  return prisma.auditLog.count({ where });
}

export async function countSecurityLogs(where: any = {}) {
  return prisma.securityLog.count({ where });
}

export async function countApplicationLogs(where: any = {}) {
  return prisma.applicationLog.count({ where });
}

export async function groupAuditLogsByEntityType() {
  return prisma.auditLog.groupBy({
    by: ["entityType"],
    _count: true,
    orderBy: { _count: { entityType: "desc" } },
  });
}

export async function groupSecurityEventsByType() {
  return prisma.securityLog.groupBy({
    by: ["eventType"],
    _count: true,
    orderBy: { _count: { eventType: "desc" } },
  });
}
