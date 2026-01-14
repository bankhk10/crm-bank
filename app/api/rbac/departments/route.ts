import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/src/infrastructure/database";
import { guardPermission } from "@/lib/api-guard";

const departmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
});

export async function GET() {
  // Allow users with employee.manage to read departments for employee form
  const guardResult = await guardPermission("employee.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const departments = await db.department.findMany({
    where: { deletedAt: null },
    include: { positions: { where: { deletedAt: null } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(departments);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = departmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const department = await db.department.create({
    data: {
      name: payload.name,
      code: payload.code.toUpperCase(),
      description: payload.description,
    },
  });

  return NextResponse.json(department, { status: 201 });
}
