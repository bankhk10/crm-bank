/**
 * Authentication Logging Helpers
 * ช่วยสำหรับ logging ใน authentication flow
 */

import { headers } from "next/headers";
import { securityLogger } from "@/lib/logger";
import { extractClientIp, extractUserAgent } from "@/lib/logger/utils";

/**
 * Get client info from request headers
 * สำหรับใช้ใน Server Components และ Server Actions
 */
export async function getClientInfo(): Promise<{
  ipAddress: string;
  userAgent: string;
}> {
  try {
    const headersList = await headers();
    const headersObj = Object.fromEntries(headersList.entries());

    return {
      ipAddress: extractClientIp(headersObj),
      userAgent: extractUserAgent(headersObj),
    };
  } catch {
    return {
      ipAddress: "unknown",
      userAgent: "unknown",
    };
  }
}

/**
 * Log successful login
 * เรียกใช้หลังจาก signIn สำเร็จ
 */
export async function logLoginSuccess(
  userId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  const { ipAddress, userAgent } = await getClientInfo();

  await securityLogger.logLoginSuccess(
    userId,
    userEmail,
    userName,
    ipAddress,
    userAgent
  );
}

/**
 * Log failed login attempt
 * เรียกใช้เมื่อ signIn ไม่สำเร็จ
 */
export async function logLoginFailed(
  email: string,
  reason: string
): Promise<void> {
  const { ipAddress, userAgent } = await getClientInfo();

  await securityLogger.logLoginFailed(email, ipAddress, userAgent, reason);
}

/**
 * Log logout
 * เรียกใช้เมื่อ signOut
 */
export async function logLogout(
  userId: string,
  userEmail: string
): Promise<void> {
  const { ipAddress, userAgent } = await getClientInfo();

  await securityLogger.logLogout(userId, userEmail, ipAddress, userAgent);
}

/**
 * Check if login is blocked for IP/email
 */
export async function isLoginBlocked(email: string): Promise<boolean> {
  const { ipAddress } = await getClientInfo();
  return securityLogger.isBlocked(ipAddress, email);
}

/**
 * Log password change
 */
export async function logPasswordChange(
  userId: string,
  userEmail: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  const { ipAddress, userAgent } = await getClientInfo();

  await securityLogger.logPasswordChange(
    userId,
    userEmail,
    ipAddress,
    userAgent,
    success,
    failureReason
  );
}
