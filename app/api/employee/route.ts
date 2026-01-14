import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/employee";
const requiredPermission = "employee.manage";

const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    // If exact route match fails, check if they have general management permission
    if (!session.user.permissions["employee.manage"]?.allow) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const employees = await db.employee.findMany({
    where: { deletedAt: null },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`[API] Returning ${employees.length} employees`);
  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const employee = await db.employee.create({
    data: {
      ...parsed.data,
      managerId: session.user.id,
    },
  });

  return NextResponse.json({ employee }, { status: 201 });
}
