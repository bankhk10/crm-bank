import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";
import { z } from "zod";

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
      manager: { select: { id: true, name: true } },
      // include linked user and their active roles so callers (edit page) can
      // prefill login/role information
      user: {
        select: {
          id: true,
          email: true,
          userRoles: {
            where: { deletedAt: null },
            include: { role: true }
          }
        }
      }
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

  // Validate payload with Zod
  const addressSchema = z.object({
    addressLine: z.string().nullable().optional(),
    province: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    subdistrict: z.string().nullable().optional(),
    postalCode: z.union([z.string(), z.number()]).nullable().optional(),
  });

  const employeeSchema = z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      prefix: z.string().nullable().optional(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
      employeeCode: z.string().nullable().optional(),
      birthDate: z.string().nullable().optional(),
      addressLine: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      responsibilityArea: z.string().nullable().optional(),
      status: z.string().nullable().optional(),
      positionTitle: z.string().nullable().optional(),
      departmentName: z.string().nullable().optional(),
      roleTitle: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
      departmentId: z.string().nullable().optional(),
      positionId: z.string().nullable().optional(),
      managerId: z.string().nullable().optional(),
      address: addressSchema.optional().nullable(),
    })
    .passthrough();

  const parseResult = employeeSchema.safeParse(body.employee);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 });
  }

  try {
    const payload = parseResult.data as Record<string, any>;

    const { companyId, departmentId, positionId, managerId, address, birthDate, ...other } = payload;

    // Map address object (from client) into top-level prisma fields
    const addressFields: Record<string, any> = {};
    if (address && typeof address === "object") {
      if (address.addressLine !== undefined) addressFields.addressLine = address.addressLine;
      if (address.province !== undefined) addressFields.province = address.province;
      if (address.district !== undefined) addressFields.district = address.district;
      if (address.subdistrict !== undefined) addressFields.subdistrict = address.subdistrict;
      if (address.postalCode !== undefined) addressFields.postalCode = String(address.postalCode);
    }

    // Helper to build relation connect/disconnect object
    const rel = (relName: string, id: unknown) => {
      if (id === null) return { [relName]: { disconnect: true } };
      if (typeof id === "string" && id.length > 0) return { [relName]: { connect: { id } } };
      return {};
    };

    const data: Record<string, any> = {
      ...other,
      ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
      ...addressFields,
      ...rel("company", companyId),
      ...rel("department", departmentId),
      ...rel("position", positionId),
      ...rel("manager", managerId),
    };

    const updated = await db.employee.update({ where: { id: employeeId }, data });
    return NextResponse.json({ employee: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Update failed" }, { status: 400 });
  }
}
