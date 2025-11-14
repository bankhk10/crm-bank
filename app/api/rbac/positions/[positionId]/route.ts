import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  level: z.number().int().min(1).max(10).optional(),
  isManagerial: z.boolean().optional(),
  departmentId: z.string().nullable().optional(),
  defaultRoleId: z.string().nullable().optional()
});

interface RouteParams {
  params: { positionId: string };
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
  const positionId = resolvedParams?.positionId as string | undefined;

  if (!positionId) {
    return NextResponse.json({ error: "Missing position id" }, { status: 400 });
  }

  const position = await db.position.update({
    where: { id: positionId },
    data: parsed.data
  });

  return NextResponse.json(position);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const positionId = resolvedParams?.positionId as string | undefined;

  if (!positionId) {
    return NextResponse.json({ error: "Missing position id" }, { status: 400 });
  }

  await db.position.delete({ where: { id: positionId } });
  return NextResponse.json({ ok: true });
}
