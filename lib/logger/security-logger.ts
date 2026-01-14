/**
 * Security Logger Service
 * บริการสำหรับ Security Logging
 */

import { LogSeverity, SecurityEventType } from "@prisma/client";
import { db as prisma } from "@/src/infrastructure/database";
import {
  RequestContext,
  SECURITY_EVENTS_CONFIG,
  SecurityLogCreateInput,
} from "./types";
import { calculateRiskScore } from "./utils";
import { logger } from "./app-logger";
import { SECURITY_RATE_LIMITS } from "./config";

class SecurityLogger {
  /**
   * Log a security event
   */
  async log(input: SecurityLogCreateInput): Promise<void> {
    const { context, ...logData } = input;

    try {
      // Get event configuration
      const eventConfig = SECURITY_EVENTS_CONFIG[logData.eventType];

      // Calculate risk score if not provided
      const riskScore =
        logData.riskScore ??
        calculateRiskScore(
          logData.eventType,
          logData.attemptCount,
          logData.success
        );

      await prisma.securityLog.create({
        data: {
          // Event information
          eventType: logData.eventType,
          severity: logData.severity ?? eventConfig?.severity ?? "INFO",
          message: logData.message,

          // User context
          userId: context.userId,
          userEmail: context.userEmail,
          userName: context.userName,

          // Request information
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          geoLocation: logData.geoLocation,

          // Session information
          sessionId: context.sessionId,
          requestId: context.requestId,

          // Event details - cast to Prisma.InputJsonValue
          details: logData.details as object | undefined,
          targetUserId: logData.targetUserId,
          targetUserEmail: logData.targetUserEmail,

          // Result
          success: logData.success ?? true,
          failureReason: logData.failureReason,

          // Risk assessment
          riskScore,
          isBlocked: logData.isBlocked ?? false,
          attemptCount: logData.attemptCount ?? 1,
        },
      });

      // Log to application logger
      const logLevel = this.getLogLevel(eventConfig?.severity ?? "INFO");
      logger[logLevel](`Security: ${logData.eventType}`, {
        module: "security",
        metadata: {
          userId: context.userId,
          ipAddress: logData.ipAddress,
          success: logData.success,
          riskScore,
        },
      });

      // TODO: Trigger alerts for high-severity events
      if (eventConfig?.shouldAlert && riskScore >= 60) {
        // await this.triggerAlert(logData, context);
      }
    } catch (error) {
      logger.error("Failed to create security log", error, {
        module: "security",
        metadata: { input: logData },
      });
    }
  }

  /**
   * Convert severity to log level
   */
  private getLogLevel(
    severity: LogSeverity
  ): "debug" | "info" | "warn" | "error" {
    switch (severity) {
      case "DEBUG":
        return "debug";
      case "INFO":
        return "info";
      case "WARN":
        return "warn";
      case "ERROR":
      case "CRITICAL":
        return "error";
      default:
        return "info";
    }
  }

  /**
   * Log successful login
   */
  async logLoginSuccess(
    userId: string,
    userEmail: string,
    userName: string | undefined,
    ipAddress: string,
    userAgent?: string,
    context?: Partial<RequestContext>
  ): Promise<void> {
    await this.log({
      eventType: "LOGIN_SUCCESS",
      ipAddress,
      userAgent,
      success: true,
      context: {
        ...context,
        userId,
        userEmail,
        userName,
      },
    });
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailed(
    email: string,
    ipAddress: string,
    userAgent: string | undefined,
    reason: string,
    context?: Partial<RequestContext>
  ): Promise<void> {
    // Get recent failed attempts
    const attemptCount = await this.getRecentFailedAttempts(ipAddress, email);

    // Check if should block
    const shouldBlock =
      attemptCount >= SECURITY_RATE_LIMITS.loginAttempts.maxAttempts;

    await this.log({
      eventType: "LOGIN_FAILED",
      severity: shouldBlock ? "ERROR" : "WARN",
      ipAddress,
      userAgent,
      success: false,
      failureReason: reason,
      attemptCount: attemptCount + 1,
      isBlocked: shouldBlock,
      context: {
        ...context,
        userEmail: email,
      },
      details: {
        email,
        attemptNumber: attemptCount + 1,
        blocked: shouldBlock,
      },
    });

    // If blocked, also log account locked event
    if (shouldBlock) {
      await this.logAccountLocked(email, ipAddress, userAgent, context);
    }
  }

  /**
   * Log logout
   */
  async logLogout(
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    context?: Partial<RequestContext>
  ): Promise<void> {
    await this.log({
      eventType: "LOGOUT",
      ipAddress,
      userAgent,
      success: true,
      context: {
        ...context,
        userId,
        userEmail,
      },
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent: string | undefined,
    success: boolean,
    failureReason?: string,
    context?: Partial<RequestContext>
  ): Promise<void> {
    await this.log({
      eventType: "PASSWORD_CHANGE",
      severity: success ? "INFO" : "WARN",
      ipAddress,
      userAgent,
      success,
      failureReason,
      context: {
        ...context,
        userId,
        userEmail,
      },
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    targetUserId: string,
    targetUserEmail: string,
    changes: Record<string, unknown>,
    ipAddress: string,
    userAgent: string | undefined,
    context: RequestContext
  ): Promise<void> {
    await this.log({
      eventType: "PERMISSION_CHANGE",
      severity: "CRITICAL",
      ipAddress,
      userAgent,
      success: true,
      targetUserId,
      targetUserEmail,
      details: changes,
      context,
    });
  }

  /**
   * Log role change
   */
  async logRoleChange(
    targetUserId: string,
    targetUserEmail: string,
    oldRoles: string[],
    newRoles: string[],
    ipAddress: string,
    userAgent: string | undefined,
    context: RequestContext
  ): Promise<void> {
    await this.log({
      eventType: "ROLE_CHANGE",
      severity: "CRITICAL",
      ipAddress,
      userAgent,
      success: true,
      targetUserId,
      targetUserEmail,
      details: { oldRoles, newRoles },
      context,
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    action: string,
    targetUserId: string | undefined,
    targetUserEmail: string | undefined,
    details: Record<string, unknown>,
    ipAddress: string,
    userAgent: string | undefined,
    context: RequestContext
  ): Promise<void> {
    await this.log({
      eventType: "ADMIN_ACTION",
      severity: "CRITICAL",
      message: action,
      ipAddress,
      userAgent,
      success: true,
      targetUserId,
      targetUserEmail,
      details,
      context,
    });
  }

  /**
   * Log data export
   */
  async logDataExport(
    entityType: string,
    recordCount: number,
    exportFormat: string,
    ipAddress: string,
    userAgent: string | undefined,
    context: RequestContext
  ): Promise<void> {
    await this.log({
      eventType: "DATA_EXPORT",
      severity: "WARN",
      ipAddress,
      userAgent,
      success: true,
      details: { entityType, recordCount, exportFormat },
      context,
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    description: string,
    details: Record<string, unknown>,
    ipAddress: string,
    userAgent: string | undefined,
    riskScore: number,
    context: Partial<RequestContext>
  ): Promise<void> {
    await this.log({
      eventType: "SUSPICIOUS_ACTIVITY",
      severity: "CRITICAL",
      message: description,
      ipAddress,
      userAgent,
      success: false,
      riskScore,
      details,
      context,
    });
  }

  /**
   * Log account locked
   */
  async logAccountLocked(
    email: string,
    ipAddress: string,
    userAgent: string | undefined,
    context?: Partial<RequestContext>
  ): Promise<void> {
    await this.log({
      eventType: "ACCOUNT_LOCKED",
      severity: "WARN",
      message: `Account locked due to too many failed login attempts`,
      ipAddress,
      userAgent,
      success: true,
      details: { email },
      context: {
        ...context,
        userEmail: email,
      },
    });
  }

  /**
   * Log account unlocked
   */
  async logAccountUnlocked(
    email: string,
    unlockedBy: string,
    ipAddress: string,
    userAgent: string | undefined,
    context: RequestContext
  ): Promise<void> {
    await this.log({
      eventType: "ACCOUNT_UNLOCKED",
      severity: "INFO",
      message: `Account unlocked by ${unlockedBy}`,
      ipAddress,
      userAgent,
      success: true,
      details: { email, unlockedBy },
      context,
    });
  }

  /**
   * Get recent failed login attempts for IP/email
   */
  private async getRecentFailedAttempts(
    ipAddress: string,
    email: string
  ): Promise<number> {
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() -
        SECURITY_RATE_LIMITS.loginAttempts.windowMinutes
    );

    const count = await prisma.securityLog.count({
      where: {
        OR: [{ ipAddress }, { userEmail: email }],
        eventType: "LOGIN_FAILED",
        timestamp: {
          gte: windowStart,
        },
      },
    });

    return count;
  }

  /**
   * Check if IP/email is currently blocked
   */
  async isBlocked(ipAddress: string, email?: string): Promise<boolean> {
    const lockoutEnd = new Date();
    lockoutEnd.setMinutes(
      lockoutEnd.getMinutes() -
        SECURITY_RATE_LIMITS.loginAttempts.lockoutMinutes
    );

    const blockedLog = await prisma.securityLog.findFirst({
      where: {
        OR: [{ ipAddress }, ...(email ? [{ userEmail: email }] : [])],
        eventType: "ACCOUNT_LOCKED",
        timestamp: {
          gte: lockoutEnd,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!blockedLog) return false;

    // Check if unlocked after being locked
    const unlockedAfter = await prisma.securityLog.findFirst({
      where: {
        OR: [{ ipAddress }, ...(email ? [{ userEmail: email }] : [])],
        eventType: "ACCOUNT_UNLOCKED",
        timestamp: {
          gt: blockedLog.timestamp,
        },
      },
    });

    return !unlockedAfter;
  }

  /**
   * Get security logs for a user
   */
  async getLogsForUser(
    userId: string,
    options?: { limit?: number; offset?: number; eventType?: SecurityEventType }
  ) {
    return prisma.securityLog.findMany({
      where: {
        userId,
        ...(options?.eventType && { eventType: options.eventType }),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  /**
   * Get recent security events
   */
  async getRecentEvents(options?: {
    limit?: number;
    offset?: number;
    eventType?: SecurityEventType;
    severity?: LogSeverity;
    minRiskScore?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.securityLog.findMany({
      where: {
        ...(options?.eventType && { eventType: options.eventType }),
        ...(options?.severity && { severity: options.severity }),
        ...(options?.minRiskScore && {
          riskScore: { gte: options.minRiskScore },
        }),
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
    });
  }

  /**
   * Get high-risk events
   */
  async getHighRiskEvents(minScore: number = 60, limit: number = 20) {
    return prisma.securityLog.findMany({
      where: {
        riskScore: { gte: minScore },
      },
      orderBy: [{ riskScore: "desc" }, { timestamp: "desc" }],
      take: limit,
    });
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

// Export class for testing
export { SecurityLogger };
