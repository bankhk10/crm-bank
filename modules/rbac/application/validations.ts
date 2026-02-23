/**
 * RBAC Validation Schemas
 *
 * Zod schemas shared between client forms and server-side validation.
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// Role
// ─────────────────────────────────────────────

export const roleSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  slug: z
    .string()
    .min(3, "Slug ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-z0-9_-]+$/, "Slug ต้องเป็นตัวอักษรพิมพ์เล็ก ตัวเลข หรือ _ -"),
  description: z.string().optional(),
});

export const roleUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────

export const permissionSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  key: z.string().min(3, "Key ต้องมีอย่างน้อย 3 ตัวอักษร"),
  category: z.enum(["MENU", "ACTION", "DATA"]),
  resource: z.string().optional(),
  menuPath: z.string().optional(),
  action: z.string().optional(),
  defaultDataAccess: z
    .enum(["VIEW_OWN", "VIEW_TEAM", "VIEW_DEPARTMENT", "VIEW_ALL"])
    .optional(),
});

export const permissionUpdateSchema = z.object({
  key: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category: z.enum(["MENU", "ACTION", "DATA"]).optional(),
  menuPath: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  resource: z.string().nullable().optional(),
  defaultDataAccess: z
    .enum(["VIEW_OWN", "VIEW_TEAM", "VIEW_DEPARTMENT", "VIEW_ALL"])
    .nullable()
    .optional(),
});

// ─────────────────────────────────────────────
// Department
// ─────────────────────────────────────────────

export const departmentSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  code: z.string().min(2, "รหัสต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().optional(),
});

export const departmentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
});

// ─────────────────────────────────────────────
// Position
// ─────────────────────────────────────────────

export const positionSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  level: z.number().min(1).max(10),
  departmentId: z.string().optional(),
  description: z.string().nullable().optional(),
  isManagerial: z.boolean().optional(),
  defaultRoleId: z.string().nullable().optional(),
});

export const positionUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  level: z.number().int().min(1).max(10).optional(),
  isManagerial: z.boolean().optional(),
  departmentId: z.string().nullable().optional(),
  defaultRoleId: z.string().nullable().optional(),
});

// ─────────────────────────────────────────────
// Role Permissions
// ─────────────────────────────────────────────

export const rolePermissionsPayloadSchema = z.object({
  permissions: z
    .array(
      z.object({
        permissionId: z.string(),
        allow: z.boolean(),
        dataAccess: z
          .enum(["VIEW_OWN", "VIEW_TEAM", "VIEW_DEPARTMENT", "VIEW_ALL"])
          .nullable()
          .optional(),
        editAccess: z
          .enum([
            "EDIT_NONE",
            "EDIT_OWN",
            "EDIT_TEAM",
            "EDIT_DEPARTMENT",
            "EDIT_ALL",
          ])
          .nullable()
          .optional(),
        deleteAccess: z
          .enum([
            "DELETE_NONE",
            "DELETE_OWN",
            "DELETE_TEAM",
            "DELETE_DEPARTMENT",
            "DELETE_ALL",
          ])
          .nullable()
          .optional(),
      }),
    )
    .min(1),
});

// ─────────────────────────────────────────────
// User Roles
// ─────────────────────────────────────────────

export const userRolesPayloadSchema = z.object({
  roleIds: z.array(z.string()).min(1),
});

// ─────────────────────────────────────────────
// User Permission Overrides
// ─────────────────────────────────────────────

export const userOverridesPayloadSchema = z.object({
  overrides: z.array(
    z.object({
      permissionId: z.string(),
      allow: z.boolean(),
      dataAccess: z
        .enum(["VIEW_OWN", "VIEW_TEAM", "VIEW_DEPARTMENT", "VIEW_ALL"])
        .nullable()
        .optional(),
      reason: z.string().optional(),
    }),
  ),
});

// ─────────────────────────────────────────────
// Inferred Types
// ─────────────────────────────────────────────

export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type PositionFormData = z.infer<typeof positionSchema>;
