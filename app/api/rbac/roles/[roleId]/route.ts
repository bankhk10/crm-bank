import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().regex(/^[a-z0-9_\-]+$/).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

interface RouteParams {
  params: { roleId: string };
}

export async function PATCH(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const roleId = params?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  const role = await db.role.update({
    where: { id: roleId },
    data: {
      ...payload,
      slug: payload.slug?.toLowerCase()
    }
  });

  return NextResponse.json(role);
}

export async function DELETE(_: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const roleId = params?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  // Fetch role with user count and slug to protect critical roles and roles with users
  const role = await db.role.findUnique({ where: { id: roleId }, select: { slug: true, deletedAt: true } });

  if (!role || role.deletedAt) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Protect certain system roles
  const protectedSlugs = ["administrator"];
  if (protectedSlugs.includes(role.slug)) {
    return NextResponse.json({ error: "ไม่สามารถลบ role พื้นฐานได้" }, { status: 400 });
  }

  // Count only non-deleted userRoles
  const assignedCount = await db.userRole.count({ where: { roleId, deletedAt: null } });
  if (assignedCount > 0) {
    return NextResponse.json({ error: "ไม่สามารถลบ role ที่ยังมีผู้ใช้ผูกอยู่ได้" }, { status: 400 });
  }

  await db.role.update({ where: { id: roleId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
