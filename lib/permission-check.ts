/**
 * Permission check helpers for API routes
 * Provides simple functions to check permissions using the new permissionKeys array
 */

import type { Session } from "next-auth";

/**
 * Check if user has a specific permission (using permissionKeys array)
 */
export function hasPermission(
  session: Session | null,
  key: string
): boolean {
  return session?.user?.permissionKeys?.includes(key) ?? false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  session: Session | null,
  keys: string[]
): boolean {
  const permissionKeys = session?.user?.permissionKeys ?? [];
  return keys.some((key) => permissionKeys.includes(key));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  session: Session | null,
  keys: string[]
): boolean {
  const permissionKeys = session?.user?.permissionKeys ?? [];
  return keys.every((key) => permissionKeys.includes(key));
}
