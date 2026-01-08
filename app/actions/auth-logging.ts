"use server";

/**
 * Authentication Server Actions with Logging
 * Server Actions สำหรับ authentication พร้อม logging
 */

import {
  logLoginSuccess,
  logLoginFailed,
  logLogout,
  isLoginBlocked,
} from "@/lib/auth-logging";

/**
 * Log successful login
 */
export async function logSuccessfulLogin(
  userId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  await logLoginSuccess(userId, userEmail, userName);
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  email: string,
  reason: string = "Invalid credentials"
): Promise<void> {
  await logLoginFailed(email, reason);
}

/**
 * Log user logout
 */
export async function logUserLogout(
  userId: string,
  userEmail: string
): Promise<void> {
  await logLogout(userId, userEmail);
}

/**
 * Check if login is blocked
 */
export async function checkLoginBlocked(email: string): Promise<boolean> {
  return isLoginBlocked(email);
}
