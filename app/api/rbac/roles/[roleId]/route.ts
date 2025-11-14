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

export async function PATCH(request: Request, { params }: RouteParams) {
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
  const role = await db.role.update({
    where: { id: params.roleId },
    data: {
      ...payload,
      slug: payload.slug?.toLowerCase()
    }
  });

  return NextResponse.json(role);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const roleId = resolvedParams?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  // Fetch role with user count and slug to protect critical roles and roles with users
  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { slug: true, _count: { select: { userRoles: true } } }
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Protect certain system roles
  const protectedSlugs = ["administrator"];
  if (protectedSlugs.includes(role.slug)) {
    return NextResponse.json({ error: "ไม่สามารถลบ role พื้นฐานได้" }, { status: 400 });
  }

  if ((role._count?.userRoles ?? 0) > 0) {
    return NextResponse.json({ error: "ไม่สามารถลบ role ที่ยังมีผู้ใช้ผูกอยู่ได้" }, { status: 400 });
  }

  await db.role.delete({ where: { id: params.roleId } });
  return NextResponse.json({ ok: true });
}
