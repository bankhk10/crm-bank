import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  employee: z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    roleTitle: z.string().optional(),
    phone: z.string().optional(),
    companyId: z.string().optional()
  }),
  user: z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      roleId: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { employee: empPayload, user: userPayload } = parsed.data;

  // Basic uniqueness checks
  if (empPayload.email) {
    const existingEmp = await db.employee.findUnique({ where: { email: empPayload.email } });
    if (existingEmp) {
      return NextResponse.json({ error: "Employee email already in use" }, { status: 409 });
    }
  }

  if (userPayload) {
    const existingUser = await db.user.findUnique({ where: { email: userPayload.email } });
    if (existingUser) {
      return NextResponse.json({ error: "User email already in use" }, { status: 409 });
    }
  }

  // If roleId provided for user, validate it
  let roleForUser: { id: string; name: string } | null = null;
  if (userPayload?.roleId) {
    const r = await db.role.findUnique({ where: { id: userPayload.roleId } });
    if (!r) {
      return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });
    }
    roleForUser = { id: r.id, name: r.name };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      let createdUser = null;

      if (userPayload) {
        const hashed = await hash(userPayload.password, 12);

        const userCreateData: any = {
          name: empPayload.name,
          email: userPayload.email,
          password: hashed
        };

        if (userPayload.roleId) {
          userCreateData.userRoles = { create: { roleId: userPayload.roleId } };
        }

        createdUser = await tx.user.create({ data: userCreateData });
      }

      // If roleTitle not provided, and roleForUser present, use role name
      const roleTitle = empPayload.roleTitle ?? roleForUser?.name ?? null;

      const employeeCreateData: any = {
        name: empPayload.name,
        roleTitle: roleTitle,
        phone: empPayload.phone,
        companyId: empPayload.companyId
      };

      if (empPayload.email) employeeCreateData.email = empPayload.email;
      if (createdUser) employeeCreateData.userId = createdUser.id;

      const createdEmployee = await tx.employee.create({ data: employeeCreateData });

      return { user: createdUser, employee: createdEmployee };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
