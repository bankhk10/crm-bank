import { NextResponse } from "next/server";
import { z } from "zod";
import { DataAccessLevel, PermissionType } from "@prisma/client";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const updateSchema = z.object({
  key: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(PermissionType).optional(),
  menuPath: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  resource: z.string().nullable().optional(),
  defaultDataAccess: z.nativeEnum(DataAccessLevel).nullable().optional()
});

interface RouteParams {
  params: { permissionId: string };
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

  const permission = await db.permission.update({
    where: { id: params.permissionId },
    data: parsed.data
  });

  return NextResponse.json(permission);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  await db.permission.delete({ where: { id: params.permissionId } });
  return NextResponse.json({ ok: true });
}
