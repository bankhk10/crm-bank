/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the RBAC module.
 * Thin use cases are defined inline; validation schemas are in validations.ts.
 */

import {
  findRBACSummary,
  findRBACCatalog,
  findAllRoles,
  findRoleById,
  createRole,
  updateRole,
  softDeleteRole,
  findRoleForDeletion,
  countActiveUserRoles,
  findAllPermissions,
  createPermission,
  updatePermission,
  softDeletePermission,
  findAllDepartments,
  createDepartment,
  updateDepartment,
  softDeleteDepartment,
  findAllPositions,
  createPosition,
  updatePosition,
  softDeletePosition,
  upsertRolePermissions,
  updateUserRoles,
  updateUserPermissionOverrides,
} from "../infrastructure/rbac.repository";

import type {
  RoleCreateData,
  RoleUpdateData,
  PermissionCreateData,
  PermissionUpdateData,
  DepartmentCreateData,
  DepartmentUpdateData,
  PositionCreateData,
  PositionUpdateData,
  RolePermissionItem,
  PermissionOverrideItem,
} from "../infrastructure/rbac.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/** Fetch full RBAC summary. */
export async function getRBACSummaryUseCase() {
  return findRBACSummary();
}

/** Fetch RBAC catalog for dropdowns. */
export async function getRBACCatalogUseCase() {
  return findRBACCatalog();
}

// --- Roles ---

export async function listRolesUseCase() {
  return findAllRoles();
}

export async function getRoleDetailUseCase(id: string) {
  const role = await findRoleById(id);
  if (!role) {
    return { success: false as const, error: "Role not found" };
  }
  return { success: true as const, role };
}

export async function createRoleUseCase(data: RoleCreateData) {
  const role = await createRole(data);
  return { success: true as const, role };
}

export async function updateRoleUseCase(id: string, data: RoleUpdateData) {
  const role = await updateRole(id, data);
  return { success: true as const, role };
}

export async function deleteRoleUseCase(id: string) {
  const existing = await findRoleForDeletion(id);
  if (!existing || existing.deletedAt) {
    return { success: false as const, error: "Role not found" };
  }

  const protectedSlugs = ["administrator"];
  if (protectedSlugs.includes(existing.slug)) {
    return {
      success: false as const,
      error: "ไม่สามารถลบ role พื้นฐานได้",
    };
  }

  const assignedCount = await countActiveUserRoles(id);
  if (assignedCount > 0) {
    return {
      success: false as const,
      error: "ไม่สามารถลบ role ที่ยังมีผู้ใช้ผูกอยู่ได้",
    };
  }

  await softDeleteRole(id);
  return { success: true as const };
}

// --- Permissions ---

export async function listPermissionsUseCase() {
  return findAllPermissions();
}

export async function createPermissionUseCase(data: PermissionCreateData) {
  try {
    const permission = await createPermission(data);
    return { success: true as const, permission };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false as const,
        error: "Permission key already exists",
      };
    }
    throw error;
  }
}

export async function updatePermissionUseCase(
  id: string,
  data: PermissionUpdateData,
) {
  try {
    const permission = await updatePermission(id, data);
    return { success: true as const, permission };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false as const,
        error: "Permission key already exists",
      };
    }
    throw error;
  }
}

export async function deletePermissionUseCase(id: string) {
  await softDeletePermission(id);
  return { success: true as const };
}

// --- Departments ---

export async function listDepartmentsUseCase() {
  return findAllDepartments();
}

export async function createDepartmentUseCase(data: DepartmentCreateData) {
  const department = await createDepartment(data);
  return { success: true as const, department };
}

export async function updateDepartmentUseCase(
  id: string,
  data: DepartmentUpdateData,
) {
  const department = await updateDepartment(id, data);
  return { success: true as const, department };
}

export async function deleteDepartmentUseCase(id: string) {
  await softDeleteDepartment(id);
  return { success: true as const };
}

// --- Positions ---

export async function listPositionsUseCase() {
  return findAllPositions();
}

export async function createPositionUseCase(data: PositionCreateData) {
  const position = await createPosition(data);
  return { success: true as const, position };
}

export async function updatePositionUseCase(
  id: string,
  data: PositionUpdateData,
) {
  const position = await updatePosition(id, data);
  return { success: true as const, position };
}

export async function deletePositionUseCase(id: string) {
  await softDeletePosition(id);
  return { success: true as const };
}

// --- Role Permissions ---

export async function updateRolePermissionsUseCase(
  roleId: string,
  items: RolePermissionItem[],
) {
  const result = await upsertRolePermissions(roleId, items);
  return result;
}

// --- User Roles ---

export async function updateUserRolesUseCase(
  userId: string,
  roleIds: string[],
) {
  const user = await updateUserRoles(userId, roleIds);
  return user;
}

// --- User Permission Overrides ---

export async function updateUserOverridesUseCase(
  userId: string,
  overrides: PermissionOverrideItem[],
) {
  return updateUserPermissionOverrides(userId, overrides);
}

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  roleSchema,
  roleUpdateSchema,
  permissionSchema,
  permissionUpdateSchema,
  departmentSchema,
  departmentUpdateSchema,
  positionSchema,
  positionUpdateSchema,
  rolePermissionsPayloadSchema,
  userRolesPayloadSchema,
  userOverridesPayloadSchema,
  type RoleFormData,
  type PermissionFormData,
  type DepartmentFormData,
  type PositionFormData,
} from "./validations";

export * from "./authorization";
