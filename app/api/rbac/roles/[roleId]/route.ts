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

  await db.role.delete({ where: { id: params.roleId } });
  return NextResponse.json({ ok: true });
}
