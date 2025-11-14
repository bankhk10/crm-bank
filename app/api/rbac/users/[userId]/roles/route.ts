import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  roleIds: z.array(z.string()).min(1)
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
    await tx.userRole.deleteMany({ where: { userId: params.userId } });
    await tx.userRole.createMany({
      data: parsed.data.roleIds.map((roleId) => ({ userId: params.userId, roleId }))
    });
  });

  const user = await db.user.findUnique({
    where: { id: params.userId },
    include: { userRoles: { include: { role: true } } }
  });

  return NextResponse.json(user);
}
