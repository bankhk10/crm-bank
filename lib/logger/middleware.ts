/**
 * Logging Middleware
 * Middleware สำหรับ API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  logger,
  generateRequestId,
  extractClientIp,
  extractUserAgent,
} from "@/lib/logger";
import { EXCLUDED_ENDPOINTS, IGNORED_IPS } from "@/lib/logger/config";
import { RequestContext } from "@/lib/logger/types";

/**
 * Create request context from NextRequest
 */
export function createRequestContext(
  request: NextRequest,
  userId?: string,
  userEmail?: string,
  userName?: string,
  sessionId?: string
): RequestContext {
  const headers = Object.fromEntries(request.headers.entries());

  return {
    requestId: generateRequestId(),
    sessionId,
    userId,
    userEmail,
    userName,
    ipAddress: extractClientIp(headers),
    userAgent: extractUserAgent(headers),
    endpoint: request.nextUrl.pathname,
    method: request.method,
  };
}

/**
 * Check if endpoint should be excluded from logging
 */
function shouldExclude(pathname: string): boolean {
  return EXCLUDED_ENDPOINTS.some((excluded) => pathname.startsWith(excluded));
}

/**
 * Check if IP should be ignored
 */
function shouldIgnoreIp(ip: string): boolean {
  return IGNORED_IPS.includes(ip);
}

/**
 * Logging middleware wrapper for API routes
 * ใช้กับ API routes เพื่อ log requests โดยอัตโนมัติ
 *
 * @example
 * // In your API route handler:
 * export const GET = withLogging(async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ data });
 * });
 */
export function withLogging<
  T extends (...args: never[]) => Promise<NextResponse>
>(handler: T): T {
  return (async (...args: Parameters<T>): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const pathname = request.nextUrl.pathname;

    // Skip logging for excluded endpoints
    if (shouldExclude(pathname)) {
      return handler(...args);
    }

    const startTime = Date.now();
    const requestId = generateRequestId();
    const headers = Object.fromEntries(request.headers.entries());
    const clientIp = extractClientIp(headers);

    // Skip logging for ignored IPs
    if (shouldIgnoreIp(clientIp)) {
      return handler(...args);
    }

    // Create child logger with request context
    const reqLogger = logger.child({
      requestId,
      ipAddress: clientIp,
      userAgent: extractUserAgent(headers),
      endpoint: pathname,
      method: request.method,
    });

    // Log request start
    reqLogger.info(`${request.method} ${pathname}`, {
      module: "api",
      metadata: {
        query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      },
    });

    try {
      // Execute handler
      const response = await handler(...args);
      const duration = Date.now() - startTime;

      // Log request completion
      reqLogger.info(`${request.method} ${pathname} completed`, {
        module: "api",
        duration,
        metadata: {
          statusCode: response.status,
        },
      });

      // Add request ID to response headers for tracing
      response.headers.set("X-Request-ID", requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      reqLogger.error(`${request.method} ${pathname} failed`, error, {
        module: "api",
        duration,
      });

      throw error;
    }
  }) as T;
}

/**
 * Create a logging context for Server Actions
 * ใช้สำหรับ Server Actions
 *
 * @example
 * // In your server action:
 * export async function createSale(formData: FormData) {
 *   const { logger: actionLogger, context } = createActionLogger("createSale", session);
 *
 *   actionLogger.info("Creating sale");
 *   // Your action code
 * }
 */
export function createActionLogger(
  actionName: string,
  session?: { user?: { id?: string; email?: string; name?: string } } | null,
  additionalContext?: Partial<RequestContext>
) {
  const requestId = generateRequestId();

  const context: RequestContext = {
    requestId,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    userName: session?.user?.name,
    endpoint: `action:${actionName}`,
    method: "ACTION",
    ...additionalContext,
  };

  const actionLogger = logger.child(context);

  return {
    logger: actionLogger,
    context,
    requestId,
  };
}

/**
 * Wrapper for Server Actions with automatic logging
 *
 * @example
 * export const createSale = withActionLogging(
 *   "createSale",
 *   async (formData: FormData, context) => {
 *     // Your action code
 *     // context contains requestId, userId, etc.
 *   }
 * );
 */
export function withActionLogging<TArgs extends unknown[], TResult>(
  actionName: string,
  action: (...args: [...TArgs, context: RequestContext]) => Promise<TResult>,
  getSession?: () => Promise<{
    user?: { id?: string; email?: string; name?: string };
  } | null>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const session = getSession ? await getSession() : null;
    const { logger: actionLogger, context } = createActionLogger(
      actionName,
      session
    );

    const startTime = Date.now();
    actionLogger.info(`Action ${actionName} started`, { module: "action" });

    try {
      const result = await action(...args, context);
      const duration = Date.now() - startTime;

      actionLogger.info(`Action ${actionName} completed`, {
        module: "action",
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      actionLogger.error(`Action ${actionName} failed`, error, {
        module: "action",
        duration,
      });

      throw error;
    }
  };
}
