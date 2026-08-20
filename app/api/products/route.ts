import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/lib/db";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/modules/rbac";
import { findOrCreateTradeNameGroup } from "@/modules/products/infrastructure/product.repository";

const resourcePath = "/api/products";

const productSchema = z.object({
  productCode: z.string().min(1, "รหัสสินค้าต้องไม่ว่าง"),
  name: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  commonName: z.string().optional(),
  unit: z.string().optional(),
  tradeNameGroupId: z.string().nullable().optional(), // กลุ่มชื่อการค้า (Trade Name Group)
  brand: z.string().optional(),
  productGroupId: z.string().nullable().optional(), // กลุ่มสินค้า (Product Group)
  packageSize: z.coerce.number().optional(),
  packageSizeUnit: z.string().optional(),
  packageSizePerBox: z.coerce.number().optional(),
  totalPackageSizePerBox: z.coerce.number().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  usedForPlants: z.array(z.string()).default([]),
  salesPoint: z.string().optional(),
  properties: z.string().optional(),
  pointPerUnit: z.number().int().min(0).optional(),
  // New fields
  categoryId: z.string().nullable().optional(), // FK to ProductCategory (หมวดสินค้า)
  productABCTypeId: z.string().nullable().optional(), // FK to ProductABCTypes (ประเภท (ABC Code))
  parentId: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissionKeys = session.user.permissionKeys ?? [];
  if (!isAuthorized(resourcePath, permissionKeys)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(
    1000,
    Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10)),
  );
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "").trim().toUpperCase();
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
  const childWhere: Prisma.ProductWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { productCode: { contains: q, mode: "insensitive" } },
      { commonName: { contains: q, mode: "insensitive" } },
    ];
    childWhere.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { productCode: { contains: q, mode: "insensitive" } },
      { commonName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status;
    childWhere.status = status;
  }

  if (fromDate || toDate) {
    const dateRange = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
    where.createdAt = dateRange;
    childWhere.createdAt = dateRange;
  }

  // If we are searching for a specific term, we shouldn't restrict to parentId: null
  // We want to find the product regardless of whether it's a parent or child.
  // We will let the findProducts function handle finding the parent and passing children down.
  // Wait, the API doesn't know about findProducts. It just returns data.
  // Let me just update where if q is not present. Actually, we should always query parents and include children.
  // If q is present, maybe we should search children too. Let's keep it simple: just where: { ...where, parentId: null }
  // unless we want to find children directly. The standard way is find all parents matching, or whose children match.
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { productCode: { contains: q, mode: "insensitive" } },
      { commonName: { contains: q, mode: "insensitive" } },
      {
        children: {
          some: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { productCode: { contains: q, mode: "insensitive" } },
              { commonName: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status;
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  const [total, productsRaw] = await Promise.all([
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
        promotionItems: true,
        freeItems: true,
        stockLots: {
          where: {
            isUsed: false,
          },
        },
        stock: true, // NEW: Include dedicated stock table
        children: {
          where: { deletedAt: null },
          include: {
            stock: true,
            stockLots: {
              where: { isUsed: false },
            },
          },
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

  // Calculate stock quantity from stock lots
  const products = productsRaw.map((product) => {
    // Prefer data from ProductStock table if available
    if (product.stock) {
      return {
        ...product,
        stockQuantity: product.stock.physicalBalance, // Total Physical Stock
        availableQuantity: product.stock.availableQuantity,
        reservedQuantity: product.stock.reservedQuantity,
        physicalQuantity: product.stock.physicalBalance,
        children: product.children?.map((child) => {
          let childAvail = 0;
          let childRes = 0;
          let childPhys = 0;
          if ((child as any).stock) {
            childAvail = (child as any).stock.availableQuantity;
            childRes = (child as any).stock.reservedQuantity;
            childPhys = (child as any).stock.physicalBalance;
          } else if ((child as any).stockLots) {
            childAvail = (child as any).stockLots.reduce(
              (sum: number, lot: any) => sum + lot.quantity,
              0,
            );
            childPhys = childAvail;
          }
          return {
            ...child,
            stockQuantity: childPhys,
            availableQuantity: childAvail,
            reservedQuantity: childRes,
            physicalQuantity: childPhys,
          };
        }),
      };
    }

    // Fallback to calculation if sync hasn't run yet
    const availableQuantity = product.stockLots.reduce(
      (sum, lot) => sum + lot.quantity,
      0,
    );

    // Reserved quantity can't be easily calculated without the heavy query we just removed.
    // So if no stock table, reserved is 0.
    const reservedQuantity = 0;

    return {
      ...product,
      stockQuantity: availableQuantity,
      availableQuantity,
      reservedQuantity,
      physicalQuantity: availableQuantity + reservedQuantity,
      children: product.children?.map((child) => {
        let childAvail = 0;
        let childRes = 0;
        let childPhys = 0;
        if ((child as any).stock) {
          childAvail = (child as any).stock.availableQuantity;
          childRes = (child as any).stock.reservedQuantity;
          childPhys = (child as any).stock.physicalBalance;
        } else if ((child as any).stockLots) {
          childAvail = (child as any).stockLots.reduce(
            (sum: number, lot: any) => sum + lot.quantity,
            0,
          );
          childPhys = childAvail;
        }
        return {
          ...child,
          stockQuantity: childPhys,
          availableQuantity: childAvail,
          reservedQuantity: childRes,
          physicalQuantity: childPhys,
        };
      }),
    };
  });

  return NextResponse.json({ products, total, page, perPage });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissionKeys = session.user.permissionKeys ?? [];
  if (!isAuthorized(resourcePath, permissionKeys)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!permissionKeys.includes("product.create")) {
    return NextResponse.json(
      { error: "Forbidden - missing product.create" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    let tradeNameGroupId = parsed.data.tradeNameGroupId || null;
    if (parsed.data.name) {
      const resolvedGroupId = await findOrCreateTradeNameGroup(
        parsed.data.name,
      );
      if (resolvedGroupId) {
        tradeNameGroupId = resolvedGroupId;
      }
    }

    const product = await db.product.create({
      data: {
        productCode: parsed.data.productCode,
        name: parsed.data.name,
        commonName: parsed.data.commonName,
        unit: parsed.data.unit,
        tradeNameGroupId,
        brand: parsed.data.brand,
        productGroupId: parsed.data.productGroupId || null,
        packageSize: parsed.data.packageSize,
        packageSizeUnit: parsed.data.packageSizeUnit,
        packageSizePerBox: parsed.data.packageSizePerBox,
        totalPackageSizePerBox: parsed.data.totalPackageSizePerBox,
        status: parsed.data.status,
        usedForPlants: parsed.data.usedForPlants,
        salesPoint: parsed.data.salesPoint,
        properties: parsed.data.properties,
        pointPerUnit: parsed.data.pointPerUnit ?? 0,
        // New fields
        categoryId: parsed.data.categoryId || null,
        productABCTypeId: parsed.data.productABCTypeId || null,
        parentId: parsed.data.parentId || null,
      } as any,
      include: {
        images: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      if (prismaErr.code === "P2002") {
        const target = (prismaErr.meta && (prismaErr.meta as any).target) || [];
        const fields = Array.isArray(target)
          ? target.join(", ")
          : String(target);
        return NextResponse.json(
          { error: `มีรหัสสินค้านี้อยู่ในระบบแล้ว: (${fields})` },
          { status: 409 },
        );
      }
    }

    throw err;
  }
}
