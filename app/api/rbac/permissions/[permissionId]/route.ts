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

  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const permissionId = resolvedParams?.permissionId as string | undefined;

  if (!permissionId) {
    return NextResponse.json({ error: "Missing permission id" }, { status: 400 });
  }

  try {
    const permission = await db.permission.update({
      where: { id: permissionId },
      data: parsed.data
    });

    return NextResponse.json(permission);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Permission key already exists" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const permissionId = resolvedParams?.permissionId as string | undefined;

  if (!permissionId) {
    return NextResponse.json({ error: "Missing permission id" }, { status: 400 });
  }

  await db.permission.delete({ where: { id: permissionId } });
  return NextResponse.json({ ok: true });
}
