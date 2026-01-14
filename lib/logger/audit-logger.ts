/**
 * Audit Logger Service
 * บริการสำหรับ Audit Logging
 */

import { AuditAction } from "@/src/infrastructure/database";
import { db as prisma } from "@/src/infrastructure/database";
import {
  AuditLogCreateInput,
  AuditableEntity,
  AUDITABLE_ACTIONS,
  RequestContext,
} from "./types";
import { getChangedFields, maskSensitiveData } from "./utils";
import { logger } from "./app-logger";

class AuditLogger {
  /**
   * Log an audit event
   */
  async log(input: AuditLogCreateInput): Promise<void> {
    const { context, ...logData } = input;

    try {
      // Mask sensitive data in old/new values
      const maskedOldValue = logData.oldValue
        ? maskSensitiveData(logData.oldValue as Record<string, unknown>)
        : null;
      const maskedNewValue = logData.newValue
        ? maskSensitiveData(logData.newValue as Record<string, unknown>)
        : null;

      // Calculate changed fields if not provided
      const changedFields = logData.changedFields?.length
        ? logData.changedFields
        : getChangedFields(
            logData.oldValue as Record<string, unknown>,
            logData.newValue as Record<string, unknown>
          );

      await prisma.auditLog.create({
        data: {
          // User context
          userId: context.userId,
          userEmail: context.userEmail,
          userName: context.userName,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,

          // Action details
          action: logData.action,
          entityType: logData.entityType,
          entityId: logData.entityId,
          entityName: logData.entityName,

          // Data changes - cast to Prisma.InputJsonValue
          oldValue: maskedOldValue as object | undefined,
          newValue: maskedNewValue as object | undefined,
          changedFields,

          // Context
          module: logData.module,
          requestId: context.requestId,
          sessionId: context.sessionId,
          endpoint: context.endpoint,
          method: context.method,

          // Result
          success: logData.success ?? true,
          errorMessage: logData.errorMessage,
          duration: logData.duration,
        },
      });

      // Log to application logger for debugging
      logger.debug(`Audit: ${logData.action} ${logData.entityType}`, {
        module: "audit",
        metadata: {
          entityId: logData.entityId,
          entityName: logData.entityName,
          changedFields,
        },
      });
    } catch (error) {
      logger.error("Failed to create audit log", error, {
        module: "audit",
        metadata: { input: logData },
      });
    }
  }

  /**
   * Log a CREATE action
   */
  async logCreate(
    entityType: AuditableEntity,
    entityId: string,
    newValue: Record<string, unknown>,
    context: RequestContext,
    options?: { entityName?: string; module?: string; duration?: number }
  ): Promise<void> {
    await this.log({
      action: "CREATE",
      entityType,
      entityId,
      newValue,
      context,
      ...options,
    });
  }

  /**
   * Log an UPDATE action
   */
  async logUpdate(
    entityType: AuditableEntity,
    entityId: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    context: RequestContext,
    options?: { entityName?: string; module?: string; duration?: number }
  ): Promise<void> {
    await this.log({
      action: "UPDATE",
      entityType,
      entityId,
      oldValue,
      newValue,
      context,
      ...options,
    });
  }

  /**
   * Log a DELETE action
   */
  async logDelete(
    entityType: AuditableEntity,
    entityId: string,
    oldValue: Record<string, unknown>,
    context: RequestContext,
    options?: { entityName?: string; module?: string; duration?: number }
  ): Promise<void> {
    await this.log({
      action: "DELETE",
      entityType,
      entityId,
      oldValue,
      context,
      ...options,
    });
  }

  /**
   * Log an APPROVE action
   */
  async logApprove(
    entityType: AuditableEntity,
    entityId: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    context: RequestContext,
    options?: { entityName?: string; module?: string; duration?: number }
  ): Promise<void> {
    await this.log({
      action: "APPROVE",
      entityType,
      entityId,
      oldValue,
      newValue,
      context,
      ...options,
    });
  }

  /**
   * Log a REJECT action
   */
  async logReject(
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
  ): Promise<void> {
    await this.log({
      action: "REJECT",
      entityType,
      entityId,
      oldValue,
      newValue,
      context,
      ...options,
    });
  }

  /**
   * Log a VIEW action (for sensitive data access)
   */
  async logView(
    entityType: AuditableEntity,
    entityId: string,
    context: RequestContext,
    options?: { entityName?: string; module?: string }
  ): Promise<void> {
    await this.log({
      action: "VIEW",
      entityType,
      entityId,
      context,
      ...options,
    });
  }

  /**
   * Log an EXPORT action
   */
  async logExport(
    entityType: AuditableEntity,
    context: RequestContext,
    options?: {
      recordCount?: number;
      exportFormat?: string;
      filters?: Record<string, unknown>;
      module?: string;
    }
  ): Promise<void> {
    await this.log({
      action: "EXPORT",
      entityType,
      context,
      module: options?.module,
      newValue: {
        recordCount: options?.recordCount,
        exportFormat: options?.exportFormat,
        filters: options?.filters,
      },
    });
  }

  /**
   * Check if an entity/action should be audited
   */
  shouldAudit(entityType: string, action: AuditAction): boolean {
    const auditableEntity = entityType as AuditableEntity;
    const actions = AUDITABLE_ACTIONS[auditableEntity];
    return actions ? actions.includes(action) : false;
  }

  /**
   * Get audit logs for an entity
   */
  async getLogsForEntity(
    entityType: string,
    entityId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
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

  /**
   * Get audit logs for a user
   */
  async getLogsForUser(
    userId: string,
    options?: { limit?: number; offset?: number; entityType?: string }
  ) {
    return prisma.auditLog.findMany({
      where: {
        userId,
        ...(options?.entityType && { entityType: options.entityType }),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(options?: {
    limit?: number;
    offset?: number;
    entityType?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.auditLog.findMany({
      where: {
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.action && { action: options.action }),
        ...((options?.startDate || options?.endDate) && {
          timestamp: {
            ...(options?.startDate && { gte: options.startDate }),
            ...(options?.endDate && { lte: options.endDate }),
          },
        }),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
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
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export class for testing
export { AuditLogger };
