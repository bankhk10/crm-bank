/**
 * RBAC Form Schemas
 * Zod validation schemas for RBAC forms
 */

import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  slug: z
    .string()
    .min(3, "Slug ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-z0-9_-]+$/, "Slug ต้องเป็นตัวอักษรพิมพ์เล็ก ตัวเลข หรือ _ -"),
  description: z.string().optional(),
});

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

export const departmentSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  code: z.string().min(2, "รหัสต้องมีอย่างน้อย 2 ตัวอักษร"),
});

export const positionSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  level: z.number().min(1).max(10),
  departmentId: z.string().optional(),
});

export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type PositionFormData = z.infer<typeof positionSchema>;
