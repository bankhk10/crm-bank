import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/shipping-companies";

const shippingCompanySchema = z.object({
  name: z.string().min(2, "ชื่อบริษัทขนส่งต้องมีอย่างน้อย 2 ตัวอักษร"),
  phone: z.string().optional(),
  address: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  customerIds: z.array(z.string()).optional(), // รายการ customer IDs ที่ใช้บริการ
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
    100,
    Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10)),
  );
  const q = (url.searchParams.get("q") || "").trim();
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const parseDate = (value: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const fromDate = parseDate(fromParam);
  const toDate = parseDate(toParam);

  const where: Prisma.ShippingCompanyWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  const [total, shippingCompanies] = await Promise.all([
    db.shippingCompany.count({ where }),
    db.shippingCompany.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        customers: true,
      },
    }),
  ]);

  // Fetch customer details for all shipping companies
  const customerIds = shippingCompanies
    .flatMap((sc: any) => sc.customers.map((c: any) => c.customerId))
    .filter((id, index, self) => self.indexOf(id) === index); // unique

  const customers = await db.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, customerCode: true },
  });

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // Transform data to include customer list
  const transformedData = shippingCompanies.map((sc: any) => ({
    ...sc,
    customerList: sc.customers
      .map((c: any) => customerMap.get(c.customerId))
      .filter(Boolean),
    customers: undefined, // Remove the junction table data
  }));

  return NextResponse.json({
    shippingCompanies: transformedData,
    total,
    page,
    perPage,
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure caller has explicit create permission
  if (
    !(session.user.permissionKeys ?? []).includes("shipping-company.create")
  ) {
    return NextResponse.json(
      { error: "Forbidden - missing shipping-company.create" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

  const parsed = shippingCompanySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { customerIds, ...shippingCompanyData } = parsed.data;

    const shippingCompany = await db.shippingCompany.create({
      data: {
        name: shippingCompanyData.name,
        phone: shippingCompanyData.phone,
        address: shippingCompanyData.address,
        addressLine: shippingCompanyData.addressLine,
        province: shippingCompanyData.province,
        district: shippingCompanyData.district,
        subdistrict: shippingCompanyData.subdistrict,
        postalCode: shippingCompanyData.postalCode,
        notes: shippingCompanyData.notes,
        status: shippingCompanyData.status ?? "ACTIVE",
        customers: customerIds?.length
          ? {
              create: customerIds.map((customerId) => ({
                customerId: customerId,
              })),
            }
          : undefined,
      },
      include: {
        customers: true,
      },
    });

    // Fetch customer details
    const customerDetails = customerIds?.length
      ? await db.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, customerCode: true },
        })
      : [];

    const result = {
      ...shippingCompany,
      customerList: customerDetails,
      customers: undefined,
    };

    return NextResponse.json({ shippingCompany: result }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta && (err.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return NextResponse.json(
        { error: `Unique constraint failed on the fields: (${fields})` },
        { status: 409 },
      );
    }

    throw err;
  }
}
