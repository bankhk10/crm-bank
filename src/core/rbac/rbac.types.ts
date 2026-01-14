/**
 * RBAC Types
 * Type definitions for Role-Based Access Control
 */

import type {
  DataAccessLevel,
  Permission,
  PermissionType,
  RolePermission,
  UserPermissionOverride,
} from "@prisma/client";

/**
 * Session permission structure
 */
export interface SessionPermission {
  key: string;
  category: PermissionType;
  menuPath: string | null;
  action: string | null;
  resource: string | null;
  allow: boolean;
  dataAccess: DataAccessLevel | null;
}

/**
 * Route permission rule
 */
export interface RoutePermissionRule {
  pattern: RegExp;
  required: string[];
}

/**
 * Permission input from role
 */
export type PermissionInput = RolePermission & {
  permission: Permission;
};

/**
 * Permission override input
 */
export type OverrideInput = UserPermissionOverride & {
  permission: Permission;
};

/**
 * User roles for routing
 */
export type UserRoleType = "administrator" | "admin" | "manager" | "employee";

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
