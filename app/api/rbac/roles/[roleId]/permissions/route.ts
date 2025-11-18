import { NextResponse } from "next/server";
import { z } from "zod";
import { DataAccessLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  permissions: z
    .array(
      z.object({
        permissionId: z.string(),
        allow: z.boolean(),
        dataAccess: z.nativeEnum(DataAccessLevel).nullable().optional()
      })
    )
    .min(1)
});

interface RouteParams {
  params: { roleId: string };
}

export async function PUT(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }


  const roleId = params?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    // soft-delete existing rolePermissions for this role
    await tx.rolePermission.updateMany({ where: { roleId }, data: { deletedAt: new Date() } });
    // create new rolePermissions
    await tx.rolePermission.createMany({
      data: parsed.data.permissions.map((item) => ({
        roleId,
        permissionId: item.permissionId,
        allow: item.allow,
        dataAccess: item.dataAccess ?? null
      }))
    });
  });

  const role = await db.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } }
  });

  // filter out soft-deleted entries on the application side because `include` does not accept `where` in this context
  const cleaned = role
    ? {
        ...role,
        permissions: role.permissions.filter((rp) => !rp.deletedAt).map((rp) => ({
          ...rp,
          permission: rp.permission && !(rp.permission as any).deletedAt ? rp.permission : null
        }))
      }
    : role;

  return NextResponse.json(cleaned);
}
