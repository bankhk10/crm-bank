import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/employee";

export async function GET(_request: Request, { params }: { params: { employeeId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId } = params;

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: {
      company: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } }
    }
  });

  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ employee });
}

export async function DELETE(_request: Request, { params }: { params: { employeeId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId } = params;

  try {
    const deleted = await db.employee.delete({ where: { id: employeeId } });
    return NextResponse.json({ employee: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Delete failed" }, { status: 400 });
  }
}
