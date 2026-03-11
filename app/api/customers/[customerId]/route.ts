import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";
import { getRegionByProvince } from "@/lib/province-region-mapping";
import {
  logger,
  auditLogger,
  generateRequestId,
  extractClientIp,
  extractUserAgent,
} from "@/lib/logger";
import type { RequestContext } from "@/lib/logger/types";

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

  const customer = await db.customer.findFirst({
    where: { id: params.customerId, deletedAt: null },
    include: {
      creditLimits: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      images: {
        orderBy: { order: "asc" },
      },
      responsibleEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      parentDealer: {
        select: {
          id: true,
          name: true,
        },
      },
      addresses: true,
      contacts: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customerType = customer.customerType || "DEALER";
  const typePermissionKey = `customer.view.${customerType.toLowerCase()}`;
  if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
    return NextResponse.json({ error: `Forbidden - missing ${typePermissionKey}` }, { status: 403 });
  }

  return NextResponse.json({ customer });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const startTime = Date.now();
  const params = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Edit permission is checked later after fetching the existing customer

  // Create request context for logging
  const headersObj = Object.fromEntries(request.headers.entries());
  const logContext: RequestContext = {
    requestId: generateRequestId(),
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    userName: session.user.name ?? undefined,
    ipAddress: extractClientIp(headersObj),
    userAgent: extractUserAgent(headersObj),
    endpoint: `/api/customers/${params.customerId}`,
    method: "PUT",
  };
  const reqLogger = logger.child(logContext);

  const body = await request.json().catch(() => null);
  const normalizedBody =
    body && typeof body === "object"
      ? { ...(body as Record<string, unknown>) }
      : body;

  if (normalizedBody && typeof normalizedBody === "object") {
    const nb = normalizedBody as Record<string, unknown>;
    if (typeof nb.postalCode === "number") {
      nb.postalCode = String(nb.postalCode);
    }
    if (typeof nb.billingPostalCode === "number") {
      nb.billingPostalCode = String(nb.billingPostalCode);
    }
    if (typeof nb.shippingPostalCode === "number") {
      nb.shippingPostalCode = String(nb.shippingPostalCode);
    }
  }

  const parsed = customerUpdateSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Get existing customer for audit log
  const existingCustomer = await db.customer.findUnique({
    where: { id: params.customerId },
  });

  if (!existingCustomer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customerType = existingCustomer.customerType || "DEALER";
  const typePermissionKey = `customer.edit.${customerType.toLowerCase()}`;
  if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
    return NextResponse.json(
      { error: `Forbidden - missing ${typePermissionKey}` },
      { status: 403 },
    );
  }

  reqLogger.info("Updating customer", {
    module: "customers",
    metadata: {
      customerId: params.customerId,
      customerCode: existingCustomer.customerCode,
    },
  });

  // Normalize data types for Prisma
  const updateData: Record<string, unknown> = { ...parsed.data };

  // If province is being updated, automatically update region
  if (typeof updateData.province === "string") {
    updateData.region = getRegionByProvince(updateData.province as string);
  } else if (updateData.province === null) {
    updateData.region = null;
  }

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
    if (updateData.responsibleEmployeeId === "")
      updateData.responsibleEmployeeId = null;
  }

  // relationshipScore: ensure integer or null
  if (updateData.relationshipScore !== undefined) {
    const rs = updateData.relationshipScore;
    if (rs === null || rs === "") updateData.relationshipScore = null;
    else updateData.relationshipScore = Number(rs);
    if (Number.isNaN(updateData.relationshipScore))
      updateData.relationshipScore = null;
  }

  // Handle nested updates for shippingAddresses and contacts
  if (updateData.shippingAddresses) {
    const addresses = updateData.shippingAddresses as any[];
    delete updateData.shippingAddresses;
    updateData.addresses = {
      deleteMany: {},
      create: addresses.map((addr) => ({
        addressLine: addr.addressLine,
        province: addr.province,
        district: addr.district,
        subdistrict: addr.subdistrict,
        postalCode: addr.postalCode ? String(addr.postalCode) : undefined,
      })),
    };
  }

  if (updateData.contacts) {
    const contacts = updateData.contacts as any[];
    delete updateData.contacts;
    updateData.contacts = {
      deleteMany: {},
      create: contacts.map((contact) => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
      })),
    };
  }

  const customer = await db.customer.update({
    where: { id: params.customerId },
    data: updateData,
  });

  // Log audit event (UPDATE)
  const duration = Date.now() - startTime;
  await auditLogger.logUpdate(
    "Customer",
    params.customerId,
    {
      customerCode: existingCustomer.customerCode,
      name: existingCustomer.name,
      customerType: existingCustomer.customerType,
      status: existingCustomer.status,
      phone: existingCustomer.phone,
      email: existingCustomer.email,
    },
    {
      customerCode: customer.customerCode,
      name: customer.name,
      customerType: customer.customerType,
      status: customer.status,
      phone: customer.phone,
      email: customer.email,
    },
    logContext,
    {
      entityName: customer.name,
      module: "customers",
      duration,
    },
  );

  reqLogger.info("Customer updated successfully", {
    module: "customers",
    duration,
    metadata: {
      customerId: params.customerId,
      customerCode: customer.customerCode,
    },
  });

  return NextResponse.json({ customer });
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

  const existingCustomer = await db.customer.findUnique({
    where: { id: params.customerId },
    select: { customerType: true },
  });

  if (!existingCustomer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customerType = existingCustomer.customerType || "DEALER";
  const typePermissionKey = `customer.delete.${customerType.toLowerCase()}`;
  if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
    return NextResponse.json(
      { error: `Forbidden - missing ${typePermissionKey}` },
      { status: 403 },
    );
  }

  const updated = await db.customer.update({
    where: { id: params.customerId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, customer: updated });
}

