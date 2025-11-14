import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const positionSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  level: z.number().int().min(1).max(10).default(1),
  isManagerial: z.boolean().optional(),
  departmentId: z.string().nullable().optional(),
  defaultRoleId: z.string().nullable().optional()
});

export async function GET() {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const positions = await db.position.findMany({
    where: { deletedAt: null },
    include: { department: true, defaultRole: true },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(positions);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const position = await db.position.create({ data });
  return NextResponse.json(position, { status: 201 });
}
