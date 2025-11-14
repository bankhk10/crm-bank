import { NextResponse } from "next/server";
import { z } from "zod";
import { DataAccessLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  overrides: z.array(
    z.object({
      permissionId: z.string(),
      allow: z.boolean(),
      dataAccess: z.nativeEnum(DataAccessLevel).nullable().optional(),
      reason: z.string().optional()
    })
  )
});

interface RouteParams {
  params: { userId: string };
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

  await db.$transaction(async (tx) => {
    await tx.userPermissionOverride.deleteMany({ where: { userId: params.userId } });
    if (parsed.data.overrides.length) {
      await tx.userPermissionOverride.createMany({
        data: parsed.data.overrides.map((item) => ({
          userId: params.userId,
          permissionId: item.permissionId,
          allow: item.allow,
          dataAccess: item.dataAccess ?? null,
          reason: item.reason
        }))
      });
    }
  });

  const overrides = await db.userPermissionOverride.findMany({
    where: { userId: params.userId },
    include: { permission: true }
  });

  return NextResponse.json(overrides);
}
