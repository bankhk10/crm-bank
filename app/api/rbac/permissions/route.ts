import { NextResponse } from "next/server";
import { z } from "zod";
import { DataAccessLevel, PermissionType } from "@prisma/client";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.nativeEnum(PermissionType),
  menuPath: z.string().optional().nullable(),
  action: z.string().optional().nullable(),
  resource: z.string().optional().nullable(),
  defaultDataAccess: z.nativeEnum(DataAccessLevel).optional().nullable()
});

export async function GET() {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const permissions = await db.permission.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(permissions);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const permission = await db.permission.create({ data: parsed.data });
  return NextResponse.json(permission, { status: 201 });
}
