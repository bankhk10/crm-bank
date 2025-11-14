import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  departmentId: z.string().min(1),
  positionId: z.string().min(1),
  roleId: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, name, departmentId, positionId, roleId } = parsed.data;

  const role = await db.role.findUnique({ where: { id: roleId } });
  if (!role) {
    return NextResponse.json({ error: "Role ไม่ถูกต้อง" }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      departmentId,
      positionId,
      userRoles: {
        create: { roleId }
      }
    }
  });

  await db.employee.create({
    data: {
      name,
      email,
      userId: user.id,
      departmentId,
      positionId,
      roleTitle: role.name
    }
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
