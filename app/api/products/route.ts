import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/products";

const productSchema = z.object({
  productCode: z.string().min(1, "รหัสสินค้าต้องไม่ว่าง"),
  name: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  commonName: z.string().optional(),
  unit: z.string().optional(),
  productGroup: z.string().optional(),
  brand: z.string().optional(),
  packageSize: z.string().optional(),
  packageSizePerBox: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  usedForPlants: z.array(z.string()).default([]),
  salesPoint: z.string().optional(),
  properties: z.string().optional(),
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
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10))
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

  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { productCode: { contains: q, mode: "insensitive" } },
      { commonName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            freeItems: true,
            promotionItems: true,
            stockLots: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ products, total, page, perPage });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["product.create"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing product.create" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const product = await db.product.create({
      data: {
        productCode: parsed.data.productCode,
        name: parsed.data.name,
        commonName: parsed.data.commonName,
        unit: parsed.data.unit,
        productGroup: parsed.data.productGroup,
        brand: parsed.data.brand,
        packageSize: parsed.data.packageSize,
        packageSizePerBox: parsed.data.packageSizePerBox,
        status: parsed.data.status,
        usedForPlants: parsed.data.usedForPlants,
        salesPoint: parsed.data.salesPoint,
        properties: parsed.data.properties,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta && (err.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return NextResponse.json(
        { error: `มีรหัสสินค้านี้อยู่ในระบบแล้ว: (${fields})` },
        { status: 409 }
      );
    }

    throw err;
  }
}
