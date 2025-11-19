import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/companies";

const companyUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum([ "ACTIVE", "INACTIVE"]).optional()
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

  const company = await db.company.findUnique({ where: { id: params.companyId } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ company });
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

  if (!session.user.permissions?.["company.edit"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing company.edit" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  // Coerce postalCode to string if client sent a number (ThaiAddressPicker may send numbers)
  const normalizedBody = body && typeof body === "object" ? { ...(body as Record<string, unknown>) } : body;
  if (normalizedBody && typeof (normalizedBody as any).postalCode === "number") {
    (normalizedBody as any).postalCode = String((normalizedBody as any).postalCode);
  }

  const parsed = companyUpdateSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const company = await db.company.update({ where: { id: params.companyId }, data: parsed.data });
  return NextResponse.json({ company });
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

  if (!session.user.permissions?.["company.delete"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing company.delete" }, { status: 403 });
  }

  await db.company.delete({ where: { id: params.companyId } });
  return NextResponse.json({ success: true });
}
