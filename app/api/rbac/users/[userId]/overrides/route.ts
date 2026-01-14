import { NextResponse } from "next/server";
import { z } from "zod";
import { DataAccessLevel } from "@/src/infrastructure/database";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  overrides: z.array(
    z.object({
      permissionId: z.string(),
      allow: z.boolean(),
      dataAccess: z.nativeEnum(DataAccessLevel).nullable().optional(),
      reason: z.string().optional(),
    })
  ),
});

interface RouteParams {
  params: { userId: string };
}

export async function PUT(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = params?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.userPermissionOverride.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });
    if (parsed.data.overrides.length) {
      await tx.userPermissionOverride.createMany({
        data: parsed.data.overrides.map((item) => ({
          userId,
          permissionId: item.permissionId,
          allow: item.allow,
          dataAccess: item.dataAccess ?? null,
          reason: item.reason,
        })),
      });
    }
  });

  const overrides = await db.userPermissionOverride.findMany({
    where: { userId, deletedAt: null },
    include: { permission: true },
  });

  return NextResponse.json(overrides);
}
