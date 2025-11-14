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

export async function PUT(request: Request, { params }: RouteParams) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }


  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const roleId = resolvedParams?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
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

  return NextResponse.json(role);
}
