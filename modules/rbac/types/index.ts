/**
 * RBAC Types
 * Type definitions for RBAC feature components
 */

import {
  Department,
  Permission,
  Position,
  Role,
  RolePermission,
  User,
  UserPermissionOverride,
} from "@/lib/db";

/**
 * RBAC Summary Response
 */
export interface RBACSummaryResponse {
  departments: Department[];
  positions: (Position & {
    department: Department | null;
    defaultRole: Role | null;
  })[];
  roles: (Role & {
    permissions: (RolePermission & { permission: Permission })[];
    _count?: { userRoles: number };
  })[];
  permissions: Permission[];
  users: (User & {
    department: Department | null;
    position: Position | null;
    userRoles: { roleId: string; role: Role }[];
    permissionOverrides?: (UserPermissionOverride & {
      permission: Permission;
    })[];
  })[];
}

/**
 * Role with permissions for editor
 */
export interface RoleWithPermissions extends Role {
  permissions: (RolePermission & { permission: Permission })[];
}

/**
 * Role Permission Editor Props
 */
export interface RolePermissionEditorProps {
  role: RoleWithPermissions;
  allPermissions: Permission[];
}

/**
 * API Message state
 */
export interface APIMessage {
  type: "success" | "error";
  text: string;
}

export * from "./authorization";
