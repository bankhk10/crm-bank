import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/lib/db";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";
import { getRegionByProvince } from "@/lib/province-region-mapping";

const resourcePath = "/api/customers";

const customerSchema = z.object({
  customerCode: z.string().min(1).optional(),
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
  // SUBDEALER specific fields
  receiveFromDealer: z.string().optional(),
  mainCompetitor: z.string().optional(),
  areaCrops: z.string().optional(),
  averageMonthlyPurchase: z.string().optional(),
  mainProductSold: z.array(z.string()).optional(),
  brandsSold: z.array(z.string()).optional(),
  areaType: z.string().optional(),
  // FARMER specific fields
  farmPlots: z.any().optional(),
  // BROKER specific fields
  cropTypes: z.string().optional(),
  currentYield: z.string().optional(),
  farmerCount: z.string().optional(),
  plotCount: z.string().optional(),
  totalAreaRai: z.string().optional(),
  harvestPerYear: z.string().optional(),
  creditDays: z.string().optional(),
  chemicalValuePerCycle: z.string().optional(),
  chemicalQtyPerCycle: z.string().optional(),
  regularShops: z.string().optional(),
  serviceTypes: z.string().optional(),
  usedBrands: z.string().optional(),
  shippingAddresses: z
    .array(
      z.object({
        addressLine: z.string().optional(),
        province: z.string().optional(),
        district: z.string().optional(),
        subdistrict: z.string().optional(),
        postalCode: z.string().optional(),
      }),
    )
    .optional(),
  contacts: z
    .array(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      }),
    )
    .optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(
    1000,
    Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10)),
  );
  const q = (url.searchParams.get("q") || "").trim();
  const typeFilter = url.searchParams.get("type");
  const statusFilter = url.searchParams.get("status");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const parentDealerId = url.searchParams.get("parentDealerId");

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

  if (
    typeFilter &&
    ["DEALER", "SUBDEALER", "FARMER", "BROKER"].includes(typeFilter)
  ) {
    where.customerType = typeFilter as any;
  }

  if (
    statusFilter &&
    ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(statusFilter)
  ) {
    where.status = statusFilter as any;
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  if (parentDealerId) {
    where.parentDealerId = parentDealerId;
  }

  // Permission-based data scope filtering (async because of VIEW_TEAM lookup)
  const scopedWhere = await applyDataScope({ ...where }, session, "customer");

  const [total, customers] = await Promise.all([
    db.customer.count({
      where: scopedWhere,
    }),
    db.customer.findMany({
      where: scopedWhere,
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
        shippingCompanies: {
          include: {
            shippingCompany: true,
          },
        },
        parentDealer: {
          select: {
            id: true,
            customerCode: true,
            name: true,
          },
        },
        subDealers: {
          where: { deletedAt: null },
          select: {
            id: true,
            customerCode: true,
            name: true,
            customerType: true,
            status: true,
            phone: true,
            email: true,
            shippingAddressLine: true,
            shippingProvince: true,
            shippingDistrict: true,
            shippingSubdistrict: true,
            shippingPostalCode: true,
            addresses: true,
          },
          orderBy: { createdAt: "desc" },
        },
        addresses: {
          orderBy: { createdAt: "desc" },
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

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  try {
    console.info(`[api/customers] POST attempt`, {
      userId: session?.user?.id ?? null,
      customerType: body?.customerType ?? null,
      customerCode: body?.customerCode ?? null,
    });
  } catch {
    // best-effort logging, don't break request
  }

  // Check for type-specific create permission
  const customerType = body?.customerType;
  if (customerType) {
    const typePermissionKey = `customer.create.${customerType.toLowerCase()}`;
    if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
      return NextResponse.json(
        { error: `Forbidden - missing ${typePermissionKey}` },
        { status: 403 },
      );
    }
  }

  // Normalize postal codes to strings if they are numbers
  const normalizedBody =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>) }
      : body;
  if (normalizedBody && typeof normalizedBody === "object") {
    if (typeof (normalizedBody as any).postalCode === "number") {
      (normalizedBody as any).postalCode = String(
        (normalizedBody as any).postalCode,
      );
    }
    if (typeof (normalizedBody as any).billingPostalCode === "number") {
      (normalizedBody as any).billingPostalCode = String(
        (normalizedBody as any).billingPostalCode,
      );
    }
    if (typeof (normalizedBody as any).shippingPostalCode === "number") {
      (normalizedBody as any).shippingPostalCode = String(
        (normalizedBody as any).shippingPostalCode,
      );
    }
    // Normalize nested shipping addresses postal codes
    if (Array.isArray((normalizedBody as any).shippingAddresses)) {
      (normalizedBody as any).shippingAddresses.forEach((addr: any) => {
        if (typeof addr.postalCode === "number") {
          addr.postalCode = String(addr.postalCode);
        }
      });
    }
  }

  const parsed = customerSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    try {
      console.warn(`[api/customers] Invalid payload`, {
        userId: session.user.id,
        issues: parsed.error.flatten().fieldErrors,
      });
    } catch {}

    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    // Auto-generate customer code if not provided
    let customerCode = parsed.data.customerCode;

    if (!customerCode) {
      // Get current date in Thailand timezone
      const now = new Date();
      const thaiDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
      );

      // Convert to Buddhist year (add 543 years)
      const buddhistYear = thaiDate.getFullYear() + 543;
      const yearSuffix = String(buddhistYear).slice(-2); // Last 2 digits
      const month = String(thaiDate.getMonth() + 1).padStart(2, "0");

      // Determine prefix based on customer type
      const prefixMap: Record<string, string> = {
        FARMER: "F",
        BROKER: "B",
        DEALER: "D",
        SUBDEALER: "S",
      };
      const prefix = prefixMap[parsed.data.customerType];

      // Generate pattern for current month
      const pattern = `${prefix}${yearSuffix}${month}`;

      // Find the highest existing customer code for this pattern
      const existingCustomers = await db.customer.findMany({
        where: {
          customerCode: {
            startsWith: pattern,
          },
          deletedAt: null,
        },
        select: {
          customerCode: true,
        },
        orderBy: {
          customerCode: "desc",
        },
        take: 1,
      });

      let runningNumber = 1;

      if (existingCustomers.length > 0) {
        const lastCode = existingCustomers[0].customerCode;
        // Extract the running number from the last code
        const lastRunningNumber = parseInt(lastCode.slice(-4), 10);
        if (!isNaN(lastRunningNumber)) {
          runningNumber = lastRunningNumber + 1;
        }
      }

      // Check if we've exceeded the maximum running number
      if (runningNumber > 9999) {
        return NextResponse.json(
          { error: "Maximum customer codes reached for this month" },
          { status: 400 },
        );
      }

      // Format the running number with leading zeros
      const runningNumberStr = String(runningNumber).padStart(4, "0");
      customerCode = `${pattern}${runningNumberStr}`;
    }

    const customer = await db.customer.create({
      data: {
        customerCode,
        customerType: parsed.data.customerType,
        name: parsed.data.name,
        prefix: parsed.data.prefix,
        firstName: parsed.data.firstName,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : null,
        lastName: parsed.data.lastName,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        taxId: parsed.data.taxId,
        addressLine: parsed.data.addressLine,
        province: parsed.data.province,
        region: getRegionByProvince(parsed.data.province),
        district: parsed.data.district,
        subdistrict: parsed.data.subdistrict,
        postalCode: parsed.data.postalCode,
        billingAddressLine: parsed.data.billingAddressLine,
        billingProvince: parsed.data.billingProvince,
        billingDistrict: parsed.data.billingDistrict,
        billingSubdistrict: parsed.data.billingSubdistrict,
        billingPostalCode: parsed.data.billingPostalCode,
        shippingAddressLine: parsed.data.shippingAddressLine,
        shippingProvince: parsed.data.shippingProvince,
        shippingDistrict: parsed.data.shippingDistrict,
        shippingSubdistrict: parsed.data.shippingSubdistrict,
        shippingPostalCode: parsed.data.shippingPostalCode,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        relationshipScore: parsed.data.relationshipScore ?? null,
        parentDealer: parsed.data.parentDealerId
          ? { connect: { id: parsed.data.parentDealerId } }
          : undefined,
        responsibleEmployee: parsed.data.responsibleEmployeeId
          ? { connect: { id: parsed.data.responsibleEmployeeId } }
          : undefined,
        status: parsed.data.status ?? "ACTIVE",
        contactPerson: parsed.data.contactPerson,
        contactPhone: parsed.data.contactPhone,
        contactEmail: parsed.data.contactEmail || null,
        notes: parsed.data.notes,
        // SUBDEALER specific fields
        receiveFromDealer: parsed.data.receiveFromDealer ?? null,
        mainCompetitor: parsed.data.mainCompetitor ?? null,
        areaCrops: parsed.data.areaCrops ?? null,
        averageMonthlyPurchase: parsed.data.averageMonthlyPurchase ?? null,
        mainProductSold: parsed.data.mainProductSold ?? [],
        brandsSold: parsed.data.brandsSold ?? [],
        areaType: parsed.data.areaType ?? null,
        // FARMER specific fields
        farmPlots: parsed.data.farmPlots ?? null,
        // BROKER specific fields
        cropTypes: parsed.data.cropTypes ?? null,
        currentYield: parsed.data.currentYield ?? null,
        farmerCount: parsed.data.farmerCount ?? null,
        plotCount: parsed.data.plotCount ?? null,
        totalAreaRai: parsed.data.totalAreaRai ?? null,
        harvestPerYear: parsed.data.harvestPerYear ?? null,
        creditDays: parsed.data.creditDays ?? null,
        chemicalValuePerCycle: parsed.data.chemicalValuePerCycle ?? null,
        chemicalQtyPerCycle: parsed.data.chemicalQtyPerCycle ?? null,
        regularShops: parsed.data.regularShops ?? null,
        serviceTypes: parsed.data.serviceTypes ?? null,
        usedBrands: parsed.data.usedBrands ?? null,
        // ... existing fields ...
        addresses: parsed.data.shippingAddresses
          ? {
              create: parsed.data.shippingAddresses.map((addr) => ({
                addressLine: addr.addressLine,
                province: addr.province,
                district: addr.district,
                subdistrict: addr.subdistrict,
                postalCode: addr.postalCode
                  ? String(addr.postalCode)
                  : undefined,
              })),
            }
          : undefined,
        contacts: parsed.data.contacts
          ? {
              create: parsed.data.contacts.map((contact) => ({
                firstName: contact.firstName,
                lastName: contact.lastName,
                phone: contact.phone,
                email: contact.email,
              })),
            }
          : undefined,
        createdById: session.user.id,
      } as any,
    });

    try {
      console.info(`[api/customers] Customer created`, {
        userId: session.user.id,
        customerId: customer.id,
        customerCode: customer.customerCode,
      });
    } catch {}

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    try {
      console.error(`[api/customers] Error creating customer`, { error: err });
    } catch {}

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      if (prismaErr.code === "P2002") {
      const target = (prismaErr.meta && (prismaErr.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return NextResponse.json(
        { error: `Unique constraint failed on the fields: (${fields})` },
        { status: 409 },
      );
    }
  }

    throw err;
  }
}

