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
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
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
  
  if (normalizedBody && typeof (normalizedBody as any).postalCode === "number") {
    (normalizedBody as any).postalCode = String((normalizedBody as any).postalCode);
  }

  const parsed = customerUpdateSchema.safeParse(normalizedBody);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const customer = await db.customer.update({
    where: { id: params.customerId },
    data: parsed.data,
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
