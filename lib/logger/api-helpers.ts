/**
 * API Logging Helpers
 * ฟังก์ชันช่วยสำหรับการ integrate logging ใน API routes
 */

import { NextRequest } from "next/server";
import {
  logger,
  auditLogger,
  generateRequestId,
  extractClientIp,
  extractUserAgent,
} from "@/lib/logger";
import type { RequestContext, AuditableEntity } from "@/lib/logger/types";
import type { AuditAction } from "@prisma/client";

// Session type
interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

/**
 * สร้าง RequestContext จาก request และ session
 */
export function createRequestContext(
  request: Request | NextRequest,
  user: SessionUser,
  endpoint?: string
): RequestContext {
  const headersObj = Object.fromEntries(request.headers.entries());
  const url = request.url ? new URL(request.url) : null;

  return {
    requestId: generateRequestId(),
    userId: user.id,
    userEmail: user.email ?? undefined,
    userName: user.name ?? undefined,
    ipAddress: extractClientIp(headersObj),
    userAgent: extractUserAgent(headersObj),
    endpoint: endpoint || url?.pathname,
    method: request.method,
  };
}

/**
 * สร้าง child logger พร้อม context
 */
export function createApiLogger(context: RequestContext) {
  return logger.child(context);
}

/**
 * Log CREATE action
 */
export async function logCreate(
  entityType: AuditableEntity,
  entityId: string,
  newValue: Record<string, unknown>,
  context: RequestContext,
  options?: {
    entityName?: string;
    module?: string;
    duration?: number;
  }
) {
  await auditLogger.logCreate(entityType, entityId, newValue, context, options);
}

/**
 * Log UPDATE action
 */
export async function logUpdate(
  entityType: AuditableEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context: RequestContext,
  options?: {
    entityName?: string;
    module?: string;
    duration?: number;
  }
) {
  await auditLogger.logUpdate(
    entityType,
    entityId,
    oldValue,
    newValue,
    context,
    options
  );
}

/**
 * Log DELETE action
 */
export async function logDelete(
  entityType: AuditableEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  context: RequestContext,
  options?: {
    entityName?: string;
    module?: string;
    duration?: number;
  }
) {
  await auditLogger.logDelete(entityType, entityId, oldValue, context, options);
}

/**
 * Log APPROVE action
 */
export async function logApprove(
  entityType: AuditableEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context: RequestContext,
  options?: {
    entityName?: string;
    module?: string;
    duration?: number;
  }
) {
  await auditLogger.logApprove(
    entityType,
    entityId,
    oldValue,
    newValue,
    context,
    options
  );
}

/**
 * Log REJECT action
 */
export async function logReject(
  entityType: AuditableEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context: RequestContext,
  options?: {
    entityName?: string;
    module?: string;
    duration?: number;
    errorMessage?: string;
  }
) {
  await auditLogger.logReject(
    entityType,
    entityId,
    oldValue,
    newValue,
    context,
    options
  );
}

/**
 * Log custom audit action
 */
export async function logAuditAction(
  action: AuditAction,
  entityType: AuditableEntity,
  entityId: string | undefined,
  context: RequestContext,
  options?: {
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    entityName?: string;
    module?: string;
    duration?: number;
    success?: boolean;
    errorMessage?: string;
  }
) {
  await auditLogger.log({
    action,
    entityType,
    entityId,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    context,
    entityName: options?.entityName,
    module: options?.module,
    duration: options?.duration,
    success: options?.success,
    errorMessage: options?.errorMessage,
  });
}

// Re-export for convenience
export { logger, auditLogger };
export type { RequestContext };
