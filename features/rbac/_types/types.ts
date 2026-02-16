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
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/src/infrastructure/database";

/**
 * RBAC Summary Response from API
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

/**
 * Data access level options
 */
export const DATA_ACCESS_OPTIONS: { label: string; value: DataAccessLevel }[] =
  [
    { label: "เฉพาะฉัน", value: "VIEW_OWN" },
    { label: "ทีมเดียวกัน", value: "VIEW_TEAM" },
    { label: "แผนกเดียวกัน", value: "VIEW_DEPARTMENT" },
    { label: "ทั้งหมด", value: "VIEW_ALL" },
  ];

/**
 * Edit access level options
 */
export const EDIT_ACCESS_OPTIONS: { label: string; value: EditAccessLevel }[] =
  [
    { label: "เฉพาะของตัวเอง", value: "EDIT_OWN" },
    { label: "ทีมเดียวกัน", value: "EDIT_TEAM" },
    { label: "เฉพาะแผนกตัวเอง", value: "EDIT_DEPARTMENT" },
    { label: "แก้ไขได้ทั้งหมด", value: "EDIT_ALL" },
  ];

/**
 * Delete access level options
 */
export const DELETE_ACCESS_OPTIONS: {
  label: string;
  value: DeleteAccessLevel;
}[] = [
  { label: "เฉพาะของตัวเอง", value: "DELETE_OWN" },
  { label: "ทีมเดียวกัน", value: "DELETE_TEAM" },
  { label: "เฉพาะแผนกตัวเอง", value: "DELETE_DEPARTMENT" },
  { label: "ลบได้ทั้งหมด", value: "DELETE_ALL" },
];
