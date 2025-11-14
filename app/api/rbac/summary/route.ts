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
      include: { positions: true, employees: { select: { id: true } } },
      orderBy: { name: "asc" }
    }),
    db.position.findMany({
      include: { department: true, defaultRole: true },
      orderBy: { name: "asc" }
    }),
    db.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { name: "asc" }
    }),
    db.permission.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      include: {
        department: true,
        position: true,
        userRoles: { include: { role: true } }
      },
      orderBy: { name: "asc" }
    })
  ]);

  return NextResponse.json({ departments, positions, roles, permissions, users });
}
