import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/customers";

const customerSchema = z.object({
  customerCode: z.string().min(1),
  customerType: z.enum(["DEALER", "SUBDEALER", "FARMER", "BROKER"]),
  name: z.string().min(2),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  relationshipScore: z.number().int().optional(),
  parentDealerId: z.string().optional(),
  responsibleEmployeeId: z.string().optional(),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  birthDate: z.string().optional().or(z.literal("")),
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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10)));
  const q = (url.searchParams.get("q") || "").trim();
  const typeFilter = url.searchParams.get("type");
  const statusFilter = url.searchParams.get("status");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const parseDate = (value: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const fromDate = parseDate(fromParam);
  const toDate = parseDate(toParam);

  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { customerCode: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  if (typeFilter && ["DEALER", "SUBDEALER", "FARMER", "BROKER"].includes(typeFilter)) {
    where.customerType = typeFilter as any;
  }

  if (statusFilter && ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(statusFilter)) {
    where.status = statusFilter as any;
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        creditLimits: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        temporaryCreditLimits: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
  ]);

  return NextResponse.json({ customers, total, page, perPage });
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

  try {
    console.info(`[api/customers] POST attempt`, {
      userId: session?.user?.id ?? null,
      customerType: body?.customerType ?? null,
      customerCode: body?.customerCode ?? null,
    });
  } catch (logErr) {
    // best-effort logging, don't break request
  }

  // Check for type-specific create permission
  const customerType = body?.customerType;
  if (customerType) {
    const typePermissionKey = `customer.create.${customerType.toLowerCase()}`;
    if (!session.user.permissions?.[typePermissionKey]?.allow) {
      return NextResponse.json(
        { error: `Forbidden - missing ${typePermissionKey}` },
        { status: 403 }
      );
    }
  }

  const parsed = customerSchema.safeParse(body);

  if (!parsed.success) {
    try {
      console.warn(`[api/customers] Invalid payload`, {
        userId: session.user.id,
        issues: parsed.error.flatten().fieldErrors,
      });
    } catch (logErr) {}

    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const customer = await db.customer.create({
      data: ({
        customerCode: parsed.data.customerCode,
        customerType: parsed.data.customerType,
        name: parsed.data.name,
        prefix: parsed.data.prefix,
        firstName: parsed.data.firstName,
        birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
        lastName: parsed.data.lastName,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        taxId: parsed.data.taxId,
        addressLine: parsed.data.addressLine,
        province: parsed.data.province,
        district: parsed.data.district,
        subdistrict: parsed.data.subdistrict,
        postalCode: parsed.data.postalCode,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        relationshipScore: parsed.data.relationshipScore ?? null,
        parentDealerId: parsed.data.parentDealerId ?? null,
        responsibleEmployeeId: parsed.data.responsibleEmployeeId ?? null,
        status: parsed.data.status ?? "ACTIVE",
        contactPerson: parsed.data.contactPerson,
        contactPhone: parsed.data.contactPhone,
        contactEmail: parsed.data.contactEmail || null,
        notes: parsed.data.notes,
        createdById: session.user.id,
      } as any),
    });

    try {
      console.info(`[api/customers] Customer created`, {
        userId: session.user.id,
        customerId: customer.id,
        customerCode: customer.customerCode,
      });
    } catch (logErr) {}

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    try {
      console.error(`[api/customers] Error creating customer`, { error: err });
    } catch (logErr) {}

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta && (err.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return NextResponse.json(
        { error: `Unique constraint failed on the fields: (${fields})` },
        { status: 409 }
      );
    }

    throw err;
  }
}
