/**
 * RBAC Types
 * Type definitions for Role-Based Access Control
 */

import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  Permission,
  PermissionType,
  RolePermission,
  UserPermissionOverride,
} from "@/lib/db";

/**
 * Session permission structure
 */
export interface SessionPermission {
  key: string;
  category: PermissionType;
  allow: boolean;
  menuPath?: string | null;
  action?: string | null;
  resource?: string | null;
  dataAccess?: DataAccessLevel | null;
  editAccess?: EditAccessLevel | null;
  deleteAccess?: DeleteAccessLevel | null;
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

/**
 * Access scope check options
 */
export interface AccessScopeCheckOptions {
  userId: string;
  userDepartmentId?: string | null;
  resourceOwnerId?: string | null;
  resourceDepartmentId?: string | null;
}

/**
 * Access scope check result
 */
export interface AccessScopeCheckResult {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  viewScope: DataAccessLevel | null;
  editScope: EditAccessLevel | null;
  deleteScope: DeleteAccessLevel | null;
}
