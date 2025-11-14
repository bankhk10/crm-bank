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

  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const userId = resolvedParams?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    // soft-delete existing userRoles and create new ones
    await tx.userRole.updateMany({ where: { userId }, data: { deletedAt: new Date() } });
    if (parsed.data.roleIds.length) {
      await tx.userRole.createMany({
        data: parsed.data.roleIds.map((roleId) => ({ userId, roleId }))
      });
    }
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userRoles: { where: { deletedAt: null }, include: { role: true } } }
  });

  return NextResponse.json(user);
}
