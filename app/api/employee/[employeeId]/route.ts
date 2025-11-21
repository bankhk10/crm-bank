import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/employee";

export async function GET(_request: Request, { params }: { params: Promise<{ employeeId: string }> | { employeeId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId } = (await params) as { employeeId: string };

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

export async function DELETE(_request: Request, { params }: { params: Promise<{ employeeId: string }> | { employeeId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId } = (await params) as { employeeId: string };

  try {
    const updated = await db.employee.update({ where: { id: employeeId }, data: { deletedAt: new Date() } });
    return NextResponse.json({ employee: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Delete failed" }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ employeeId: string }> | { employeeId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId } = (await params) as { employeeId: string };

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || !body.employee) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updated = await db.employee.update({ where: { id: employeeId }, data: { ...body.employee } });
    return NextResponse.json({ employee: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Update failed" }, { status: 400 });
  }
}
