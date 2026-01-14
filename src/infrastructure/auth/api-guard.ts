/**
 * API Guard Utilities
 * Provides authentication and authorization checks for API routes
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export interface ApiContext {
  session: Session;
  userId: string;
  userEmail: string;
  employeeId: string | null;
}

/**
 * Requires authentication and returns user context
 * Returns null if not authenticated
 */
export async function requireAuth(): Promise<ApiContext | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    session,
    userId: session.user.id,
    userEmail: session.user.email ?? "",
    employeeId: session.user.employeeId ?? null,
  };
}

/**
 * Creates unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Creates forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Creates bad request response
 */
export function badRequestResponse(message = "Bad Request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Creates not found response
 */
export function notFoundResponse(message = "Not Found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Creates internal error response
 */
export function internalErrorResponse(message = "Internal Server Error") {
  console.error("[API Error]", message);
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  session: Session,
  permissionKey: string
): boolean {
  return session.user?.permissions?.[permissionKey]?.allow ?? false;
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  session: Session,
  permissionKeys: string[]
): boolean {
  return permissionKeys.some((key) => hasPermission(session, key));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(
  session: Session,
  permissionKeys: string[]
): boolean {
  return permissionKeys.every((key) => hasPermission(session, key));
}
