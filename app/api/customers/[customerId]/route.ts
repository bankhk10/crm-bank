import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/customers";

const customerUpdateSchema = z.object({
  customerCode: z.string().min(1).optional(),
  customerType: z.enum(["DEALER", "SUBDEALER", "FARMER", "BROKER"]).optional(),
  name: z.string().min(2).optional(),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  billingAddressLine: z.string().optional(),
  billingProvince: z.string().optional(),
  billingDistrict: z.string().optional(),
  billingSubdistrict: z.string().optional(),
  billingPostalCode: z.string().optional(),
  shippingAddressLine: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingDistrict: z.string().optional(),
  shippingSubdistrict: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  parentDealerId: z.string().optional().or(z.literal("")),
  responsibleEmployeeId: z.string().optional().or(z.literal("")),
  relationshipScore: z.number().int().nullable().optional(),
  birthDate: z.string().optional().or(z.literal("")),
});

export async function GET(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = await db.customer.findFirst({
    where: { id: params.customerId, deletedAt: null },
    include: {
      creditLimits: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PUT(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["customer.edit"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing customer.edit" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const normalizedBody = body && typeof body === "object" ? { ...(body as Record<string, unknown>) } : body;
  
  if (normalizedBody && typeof normalizedBody === "object") {
    if (typeof (normalizedBody as any).postalCode === "number") {
      (normalizedBody as any).postalCode = String((normalizedBody as any).postalCode);
    }
    if (typeof (normalizedBody as any).billingPostalCode === "number") {
      (normalizedBody as any).billingPostalCode = String((normalizedBody as any).billingPostalCode);
    }
    if (typeof (normalizedBody as any).shippingPostalCode === "number") {
      (normalizedBody as any).shippingPostalCode = String((normalizedBody as any).shippingPostalCode);
    }
  }

  const parsed = customerUpdateSchema.safeParse(normalizedBody);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Normalize data types for Prisma
  const updateData: any = { ...parsed.data };

  // birthDate: convert from date-only or string to JS Date, or null
  if (updateData.birthDate !== undefined) {
    const v = updateData.birthDate;
    if (v === "" || v === null) {
      updateData.birthDate = null;
    } else if (typeof v === "string") {
      // Try to parse date string; if it's date-only, append time to create valid ISO
      let d = new Date(v);
      if (isNaN(d.getTime())) {
        // try adding time
        d = new Date(v + "T00:00:00.000Z");
      }
      if (!isNaN(d.getTime())) updateData.birthDate = d;
      else updateData.birthDate = null;
    }
  }

  // parentDealerId / responsibleEmployeeId: convert empty string to null
  if (updateData.parentDealerId !== undefined) {
    if (updateData.parentDealerId === "") updateData.parentDealerId = null;
  }
  if (updateData.responsibleEmployeeId !== undefined) {
    if (updateData.responsibleEmployeeId === "") updateData.responsibleEmployeeId = null;
  }

  // relationshipScore: ensure integer or null
  if (updateData.relationshipScore !== undefined) {
    const rs = updateData.relationshipScore;
    if (rs === null || rs === "") updateData.relationshipScore = null;
    else updateData.relationshipScore = Number(rs);
    if (Number.isNaN(updateData.relationshipScore)) updateData.relationshipScore = null;
  }

  const customer = await db.customer.update({
    where: { id: params.customerId },
    data: updateData,
  });

  return NextResponse.json({ customer });
}

export async function DELETE(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["customer.delete"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing customer.delete" }, { status: 403 });
  }

  const updated = await db.customer.update({
    where: { id: params.customerId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, customer: updated });
}
