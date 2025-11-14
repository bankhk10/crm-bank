import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional()
});

interface RouteParams {
  params: { departmentId: string };
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

  const data = parsed.data;
  const updated = await db.department.update({
    where: { id: params.departmentId },
    data: {
      ...data,
      code: data.code?.toUpperCase()
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  await db.department.delete({ where: { id: params.departmentId } });
  return NextResponse.json({ ok: true });
}
