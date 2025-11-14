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
  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const departmentId = resolvedParams?.departmentId as string | undefined;

  if (!departmentId) {
    return NextResponse.json({ error: "Missing department id" }, { status: 400 });
  }

  const updated = await db.department.update({
    where: { id: departmentId },
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

  // `params` may be a thenable in some Next.js runtimes — unwrap if needed
  const resolvedParams = typeof (params as any)?.then === "function" ? await (params as any) : params;
  const departmentId = resolvedParams?.departmentId as string | undefined;

  if (!departmentId) {
    return NextResponse.json({ error: "Missing department id" }, { status: 400 });
  }
  await db.department.update({ where: { id: departmentId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
