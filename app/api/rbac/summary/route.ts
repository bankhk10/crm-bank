import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

export async function GET() {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const [departments, positions, roles, permissions, users] = await Promise.all([
    db.department.findMany({
      where: { deletedAt: null },
      include: { positions: true, employees: { select: { id: true } } },
      orderBy: { name: "asc" }
    }),
    db.position.findMany({
      where: { deletedAt: null },
      include: { department: true, defaultRole: true },
      orderBy: { name: "asc" }
    }),
    db.role.findMany({
      where: { deletedAt: null },
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { name: "asc" }
    }),
    db.permission.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { deletedAt: null },
      include: {
        department: true,
        position: true,
        userRoles: { where: { deletedAt: null }, include: { role: true } }
      },
      orderBy: { name: "asc" }
    })
  ]);

  // compute user role counts per role (only non-deleted userRoles)
  const roleIds = roles.map((r) => r.id);
  const roleCounts = roleIds.length
    ? await Promise.all(roleIds.map((id) => db.userRole.count({ where: { roleId: id, deletedAt: null } })))
    : [];

  const rolesWithCount = roles.map((r, idx) => ({ ...r, _count: { userRoles: roleCounts[idx] ?? 0 } }));

  return NextResponse.json({ departments, positions, roles: rolesWithCount, permissions, users });
}
