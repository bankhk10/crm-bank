"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import {
  getRBACSummaryUseCase,
  getRBACCatalogUseCase,
  listRolesUseCase,
  getRoleDetailUseCase,
  createRoleUseCase,
  updateRoleUseCase,
  deleteRoleUseCase,
  listPermissionsUseCase,
  createPermissionUseCase,
  updatePermissionUseCase,
  deletePermissionUseCase,
  listDepartmentsUseCase,
  createDepartmentUseCase,
  updateDepartmentUseCase,
  deleteDepartmentUseCase,
  listPositionsUseCase,
  createPositionUseCase,
  updatePositionUseCase,
  deletePositionUseCase,
  updateRolePermissionsUseCase,
  updateUserRolesUseCase,
  updateUserOverridesUseCase,
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
} from "../application";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }
  return { success: true as const, user: session.user };
}

async function requirePermission(permissionKey: string) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const keys = authResult.user.permissionKeys ?? [];
  if (!keys.includes(permissionKey)) {
    return { success: false as const, error: "Forbidden" };
  }
  return authResult;
}

// ─────────────────────────────────────────────
// Summary / Catalog
// ─────────────────────────────────────────────

export async function getRBACSummaryAction() {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    const data = await getRBACSummaryUseCase();
    return { success: true as const, data };
  } catch (_err) {
    return { success: false as const, error: "Failed to fetch RBAC summary" };
  }
}

export async function getRBACCatalogAction() {
  const guard = await requireAuth();
  if (!guard.success) return guard;

  try {
    const data = await getRBACCatalogUseCase();
    return { success: true as const, data };
  } catch (_err) {
    return { success: false as const, error: "Failed to fetch RBAC catalog" };
  }
}

// ─────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────

export async function listRolesAction() {
  const guard = await requirePermission("employee.manage");
  if (!guard.success) return guard;

  try {
    const roles = await listRolesUseCase();
    return { success: true as const, roles };
  } catch (_err) {
    return { success: false as const, error: "Failed to list roles" };
  }
}

export async function getRoleDetailAction(id: string) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    return await getRoleDetailUseCase(id);
  } catch (_err) {
    return { success: false as const, error: "Failed to fetch role" };
  }
}

export async function createRoleAction(rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = roleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await createRoleUseCase(parsed.data);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to create role",
    };
  }
}

export async function updateRoleAction(id: string, rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = roleUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await updateRoleUseCase(id, parsed.data);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to update role",
    };
  }
}

export async function deleteRoleAction(id: string) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    const result = await deleteRoleUseCase(id);
    if (result.success) {
      revalidatePath("/rbac");
    }
    return result;
  } catch (_err) {
    return { success: false as const, error: "Failed to delete role" };
  }
}

// ─────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────

export async function listPermissionsAction() {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    const permissions = await listPermissionsUseCase();
    return { success: true as const, permissions };
  } catch (_err) {
    return { success: false as const, error: "Failed to list permissions" };
  }
}

export async function createPermissionAction(rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = permissionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await createPermissionUseCase(parsed.data as any);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to create permission",
    };
  }
}

export async function updatePermissionAction(id: string, rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = permissionUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await updatePermissionUseCase(id, parsed.data as any);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to update permission",
    };
  }
}

export async function deletePermissionAction(id: string) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    const result = await deletePermissionUseCase(id);
    revalidatePath("/rbac");
    return result;
  } catch (_err) {
    return { success: false as const, error: "Failed to delete permission" };
  }
}

// ─────────────────────────────────────────────
// Departments
// ─────────────────────────────────────────────

export async function listDepartmentsAction() {
  const guard = await requirePermission("employee.manage");
  if (!guard.success) return guard;

  try {
    const departments = await listDepartmentsUseCase();
    return { success: true as const, departments };
  } catch (_err) {
    return { success: false as const, error: "Failed to list departments" };
  }
}

export async function createDepartmentAction(rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = departmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await createDepartmentUseCase(parsed.data);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to create department",
    };
  }
}

export async function updateDepartmentAction(id: string, rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = departmentUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await updateDepartmentUseCase(id, parsed.data);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to update department",
    };
  }
}

export async function deleteDepartmentAction(id: string) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    const result = await deleteDepartmentUseCase(id);
    revalidatePath("/rbac");
    return result;
  } catch (_err) {
    return { success: false as const, error: "Failed to delete department" };
  }
}

// ─────────────────────────────────────────────
// Positions
// ─────────────────────────────────────────────

export async function listPositionsAction() {
  const guard = await requirePermission("employee.manage");
  if (!guard.success) return guard;

  try {
    const positions = await listPositionsUseCase();
    return { success: true as const, positions };
  } catch (_err) {
    return { success: false as const, error: "Failed to list positions" };
  }
}

export async function createPositionAction(rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = positionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await createPositionUseCase(parsed.data as any);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to create position",
    };
  }
}

export async function updatePositionAction(id: string, rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = positionUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await updatePositionUseCase(id, parsed.data as any);
    revalidatePath("/rbac");
    return result;
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to update position",
    };
  }
}

export async function deletePositionAction(id: string) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  try {
    const result = await deletePositionUseCase(id);
    revalidatePath("/rbac");
    return result;
  } catch (_err) {
    return { success: false as const, error: "Failed to delete position" };
  }
}

// ─────────────────────────────────────────────
// Role Permissions
// ─────────────────────────────────────────────

export async function updateRolePermissionsAction(
  roleId: string,
  rawData: unknown,
) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = rolePermissionsPayloadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const result = await updateRolePermissionsUseCase(
      roleId,
      parsed.data.permissions as any,
    );
    revalidatePath(`/rbac/${roleId}`);
    return { success: true as const, role: result };
  } catch (_err) {
    return {
      success: false as const,
      error: "Failed to update role permissions",
    };
  }
}

// ─────────────────────────────────────────────
// User Roles
// ─────────────────────────────────────────────

export async function updateUserRolesAction(userId: string, rawData: unknown) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = userRolesPayloadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const user = await updateUserRolesUseCase(userId, parsed.data.roleIds);
    revalidatePath("/rbac");
    return { success: true as const, user };
  } catch (_err) {
    return { success: false as const, error: "Failed to update user roles" };
  }
}

// ─────────────────────────────────────────────
// User Permission Overrides
// ─────────────────────────────────────────────

export async function updateUserOverridesAction(
  userId: string,
  rawData: unknown,
) {
  const guard = await requirePermission("rbac.manage");
  if (!guard.success) return guard;

  const parsed = userOverridesPayloadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten(),
    };
  }

  try {
    const overrides = await updateUserOverridesUseCase(
      userId,
      parsed.data.overrides as any,
    );
    revalidatePath("/rbac");
    return { success: true as const, overrides };
  } catch (_err) {
    return {
      success: false as const,
      error: "Failed to update user overrides",
    };
  }
}

