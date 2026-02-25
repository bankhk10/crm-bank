import { db, Prisma } from "@/lib/db";
import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
} from "@/lib/db";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type RoleCreateData = {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
};

export type RoleUpdateData = {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

export type PermissionCreateData = {
  key: string;
  name: string;
  description?: string;
  category: PermissionType;
  menuPath?: string | null;
  action?: string | null;
  resource?: string | null;
  defaultDataAccess?: DataAccessLevel | null;
};

export type PermissionUpdateData = Partial<PermissionCreateData>;

export type DepartmentCreateData = {
  name: string;
  code: string;
  description?: string;
};

export type DepartmentUpdateData = Partial<DepartmentCreateData>;

export type PositionCreateData = {
  name: string;
  description?: string | null;
  level: number;
  isManagerial?: boolean;
  departmentId?: string | null;
  defaultRoleId?: string | null;
};

export type PositionUpdateData = Partial<PositionCreateData>;

export type RolePermissionItem = {
  permissionId: string;
  allow: boolean;
  dataAccess?: DataAccessLevel | null;
  editAccess?: EditAccessLevel | null;
  deleteAccess?: DeleteAccessLevel | null;
};

// ─────────────────────────────────────────────
// Summary / Listing
// ─────────────────────────────────────────────

/**
 * Fetch full RBAC summary (departments, positions, roles, permissions, users).
 */
export async function findRBACSummary() {
  const [departments, positions, roles, permissions, users] = await Promise.all(
    [
      db.department.findMany({
        where: { deletedAt: null },
        include: {
          positions: true,
          employees: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.position.findMany({
        where: { deletedAt: null },
        include: { department: true, defaultRole: true },
        orderBy: { name: "asc" },
      }),
      db.role.findMany({
        where: { deletedAt: null },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.permission.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      }),
      db.user.findMany({
        where: { deletedAt: null },
        include: {
          department: true,
          position: true,
          userRoles: {
            where: { deletedAt: null },
            include: { role: true },
          },
        },
        orderBy: { name: "asc" },
      }),
    ],
  );

  // Compute user role counts per role
  const roleIds = roles.map((r) => r.id);
  const roleCounts = roleIds.length
    ? await Promise.all(
        roleIds.map((id) =>
          db.userRole.count({ where: { roleId: id, deletedAt: null } }),
        ),
      )
    : [];

  const rolesWithCount = roles.map((r, idx) => ({
    ...r,
    _count: { userRoles: roleCounts[idx] ?? 0 },
  }));

  return {
    departments,
    positions,
    roles: rolesWithCount,
    permissions,
    users,
  };
}

/**
 * Fetch catalog data (departments, positions, roles) for dropdowns.
 */
export async function findRBACCatalog() {
  const [departments, positions, roles] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { name: "asc" } }),
    db.role.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    }),
  ]);

  return { departments, positions, roles };
}

// ─────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────

export async function findAllRoles() {
  return db.role.findMany({
    where: { deletedAt: null, slug: { not: "administrator" } },
    include: {
      permissions: { include: { permission: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function findRoleById(id: string) {
  return db.role.findUnique({
    where: { id },
    include: {
      permissions: {
        where: { deletedAt: null },
        include: { permission: true },
      },
    },
  });
}

export async function createRole(data: RoleCreateData) {
  return db.role.create({
    data: {
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateRole(id: string, data: RoleUpdateData) {
  return db.role.update({
    where: { id },
    data: {
      ...data,
      slug: data.slug?.toLowerCase(),
    },
  });
}

export async function softDeleteRole(id: string) {
  return db.role.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function findRoleForDeletion(id: string) {
  return db.role.findUnique({
    where: { id },
    select: { slug: true, deletedAt: true },
  });
}

export async function countActiveUserRoles(roleId: string) {
  return db.userRole.count({
    where: { roleId, deletedAt: null },
  });
}

// ─────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────

export async function findAllPermissions() {
  return db.permission.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createPermission(data: PermissionCreateData) {
  return db.permission.create({ data });
}

export async function updatePermission(id: string, data: PermissionUpdateData) {
  return db.permission.update({
    where: { id },
    data,
  });
}

export async function softDeletePermission(id: string) {
  return db.permission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ─────────────────────────────────────────────
// Departments
// ─────────────────────────────────────────────

export async function findAllDepartments() {
  return db.department.findMany({
    where: { deletedAt: null },
    include: { positions: { where: { deletedAt: null } } },
    orderBy: { name: "asc" },
  });
}

export async function createDepartment(data: DepartmentCreateData) {
  return db.department.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
    },
  });
}

export async function updateDepartment(id: string, data: DepartmentUpdateData) {
  return db.department.update({
    where: { id },
    data: {
      ...data,
      code: data.code?.toUpperCase(),
    },
  });
}

export async function softDeleteDepartment(id: string) {
  return db.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ─────────────────────────────────────────────
// Positions
// ─────────────────────────────────────────────

export async function findAllPositions() {
  return db.position.findMany({
    where: { deletedAt: null, name: { not: "Admin" } },
    include: { department: true, defaultRole: true },
    orderBy: { name: "asc" },
  });
}

export async function createPosition(data: PositionCreateData) {
  return db.position.create({ data });
}

export async function updatePosition(id: string, data: PositionUpdateData) {
  return db.position.update({
    where: { id },
    data,
  });
}

export async function softDeletePosition(id: string) {
  return db.position.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ─────────────────────────────────────────────
// Role Permissions (Mapping)
// ─────────────────────────────────────────────

export async function upsertRolePermissions(
  roleId: string,
  items: RolePermissionItem[],
) {
  await db.$transaction(async (tx) => {
    const existing = await tx.rolePermission.findMany({
      where: { roleId },
    });

    const inputPermissionIds = new Set(items.map((p) => p.permissionId));

    // Upsert
    for (const item of items) {
      const match = existing.find((e) => e.permissionId === item.permissionId);
      if (match) {
        await tx.rolePermission.update({
          where: { id: match.id },
          data: {
            allow: item.allow,
            dataAccess: item.dataAccess ?? null,
            editAccess: item.editAccess ?? null,
            deleteAccess: item.deleteAccess ?? null,
            deletedAt: null,
          },
        });
      } else {
        await tx.rolePermission.create({
          data: {
            roleId,
            permissionId: item.permissionId,
            allow: item.allow,
            dataAccess: item.dataAccess ?? null,
            editAccess: item.editAccess ?? null,
            deleteAccess: item.deleteAccess ?? null,
          },
        });
      }
    }

    // Soft delete removed entries
    const toDelete = existing.filter(
      (e) => !inputPermissionIds.has(e.permissionId) && !e.deletedAt,
    );
    if (toDelete.length > 0) {
      await tx.rolePermission.updateMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
        data: { deletedAt: new Date() },
      });
    }
  });

  // Return updated role with permissions
  const role = await db.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });

  if (!role) return null;

  return {
    ...role,
    permissions: role.permissions
      .filter((rp) => !rp.deletedAt)
      .map((rp) => ({
        ...rp,
        permission:
          rp.permission && !(rp.permission as any).deletedAt
            ? rp.permission
            : null,
      })),
  };
}

// ─────────────────────────────────────────────
// User Roles
// ─────────────────────────────────────────────

export async function updateUserRoles(userId: string, roleIds: string[]) {
  await db.$transaction(async (tx) => {
    await tx.userRole.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });
    if (roleIds.length) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
      });
    }
  });

  return db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { where: { deletedAt: null }, include: { role: true } },
    },
  });
}

// ─────────────────────────────────────────────
// User Permission Overrides
// ─────────────────────────────────────────────

export type PermissionOverrideItem = {
  permissionId: string;
  allow: boolean;
  dataAccess?: DataAccessLevel | null;
  reason?: string;
};

export async function updateUserPermissionOverrides(
  userId: string,
  overrides: PermissionOverrideItem[],
) {
  await db.$transaction(async (tx) => {
    await tx.userPermissionOverride.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });
    if (overrides.length) {
      await tx.userPermissionOverride.createMany({
        data: overrides.map((item) => ({
          userId,
          permissionId: item.permissionId,
          allow: item.allow,
          dataAccess: item.dataAccess ?? null,
          reason: item.reason,
        })),
      });
    }
  });

  return db.userPermissionOverride.findMany({
    where: { userId, deletedAt: null },
    include: { permission: true },
  });
}
