import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/shipping-companies";

const shippingCompanyUpdateSchema = z.object({
  name: z.string().min(2, "ชื่อบริษัทขนส่งต้องมีอย่างน้อย 2 ตัวอักษร").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  customerIds: z.array(z.string()).optional(), // รายการ customer IDs ที่ใช้บริการ
});

export async function GET(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shippingCompany = await db.shippingCompany.findFirst({
    where: { id: params.shippingCompanyId, deletedAt: null },
    include: {
      customers: true,
    },
  });

  if (!shippingCompany)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch customer details
  const customerIds = (shippingCompany as any).customers.map((c: any) => c.customerId);
  const customers = customerIds.length
    ? await db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, customerCode: true },
      })
    : [];

  // Transform data
  const transformed = {
    ...shippingCompany,
    customerList: customers,
    customers: undefined,
  };

  return NextResponse.json({ shippingCompany: transformed });
}

export async function PUT(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !(session.user.permissionKeys ?? []).includes("shipping-company.edit")
  ) {
    return NextResponse.json(
      { error: "Forbidden - missing shipping-company.edit" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = shippingCompanyUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { customerIds, ...updateData } = parsed.data;

  // Update shipping company and customer relationships
  const shippingCompany = await db.shippingCompany.update({
    where: { id: params.shippingCompanyId },
    data: {
      ...updateData,
      ...(customerIds !== undefined
        ? {
            customers: {
              deleteMany: {}, // ลบความสัมพันธ์เดิมทั้งหมด
              create: customerIds.map((customerId) => ({
                customerId: customerId,
              })),
            },
          }
        : {}),
    },
    include: {
      customers: true,
    },
  });

  // Fetch customer details
  const updatedCustomerIds = customerIds ?? (shippingCompany as any).customers.map((c: any) => c.customerId);
  const customers = updatedCustomerIds.length
    ? await db.customer.findMany({
        where: { id: { in: updatedCustomerIds } },
        select: { id: true, name: true, customerCode: true },
      })
    : [];

  const result = {
    ...shippingCompany,
    customerList: customers,
    customers: undefined,
  };

  return NextResponse.json({ shippingCompany: result });
}

export async function DELETE(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !(session.user.permissionKeys ?? []).includes("shipping-company.delete")
  ) {
    return NextResponse.json(
      { error: "Forbidden - missing shipping-company.delete" },
      { status: 403 }
    );
  }

  // Soft delete
  const updated = await db.shippingCompany.update({
    where: { id: params.shippingCompanyId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, shippingCompany: updated });
}
