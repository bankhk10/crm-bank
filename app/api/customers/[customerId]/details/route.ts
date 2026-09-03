import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";
import { applyDataScope } from "@/lib/data-scope";
import type { Prisma, SaleStatus } from "@/lib/db";

import { startOfDay, endOfDay, parseISO } from "date-fns";
import { calculateLitersOrKg, roundNumber } from "@/lib/volume-utils";

const resourcePath = "/api/customers";

export async function GET(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const params = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate") || url.searchParams.get("dateFrom");
  const endDateParam = url.searchParams.get("endDate") || url.searchParams.get("dateTo");
  const statusParam = url.searchParams.getAll("status");
  const employeeIdParam = url.searchParams.get("employeeId");

  // Build date filter for promotional budget transactions
  const promoDateFilter: { transactionDate?: { gte?: Date; lte?: Date } } = {};
  if (startDateParam) {
    promoDateFilter.transactionDate = { gte: startOfDay(parseISO(startDateParam)) };
  }
  if (endDateParam) {
    promoDateFilter.transactionDate = {
      ...promoDateFilter.transactionDate,
      lte: endOfDay(parseISO(endDateParam)),
    };
  }

  // Data Scope / RBAC for sales
  const saleExtraWhere: Record<string, unknown> = {};
  await applyDataScope(saleExtraWhere, session, "sale");

  // Date filter matching /sales (findSales in sale.repository.ts)
  const saleDateWhere: { gte?: Date; lt?: Date } = {};
  if (startDateParam) {
    saleDateWhere.gte = new Date(startDateParam);
  }
  if (endDateParam) {
    const d = new Date(endDateParam);
    d.setDate(d.getDate() + 1);
    saleDateWhere.lt = d;
  }

  // Status filter matching /sales
  const statusList = statusParam
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean) as SaleStatus[];
  let statusWhere: Prisma.SaleWhereInput["status"] = undefined;
  if (statusList.length === 1) {
    statusWhere = statusList[0];
  } else if (statusList.length > 1) {
    statusWhere = { in: statusList };
  }

  // Unified Base Sale Where matching /sales semantics
  const baseSaleWhere: Prisma.SaleWhereInput = {
    customerId: params.customerId,
    deletedAt: null,
    ...saleExtraWhere,
  };
  if (employeeIdParam) {
    baseSaleWhere.employeeId = employeeIdParam;
  }
  if (statusWhere) {
    baseSaleWhere.status = statusWhere;
  }
  if (startDateParam || endDateParam) {
    baseSaleWhere.saleDate = saleDateWhere;
  }

  // Get customer with all related data
  const customer = await db.customer.findFirst({
    where: { id: params.customerId, deletedAt: null },
    include: {
      creditLimits: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      temporaryCreditLimits: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
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
          phone: true,
        },
      },
      parentDealer: {
        select: {
          id: true,
          name: true,
          customerCode: true,
        },
      },
      promotionalBudgets: {
        where: { deletedAt: null },
        orderBy: { year: "desc" },
        include: {
          details: {
            where: {
              deletedAt: null,
              ...promoDateFilter,
            },
            orderBy: { transactionDate: "desc" },
            select: {
              id: true,
              transactionDate: true,
              type: true,
              receivedAmount: true,
              usedAmount: true,
              description: true,
              sale: {
                select: {
                  saleNumber: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get sales statistics
  const salesStats = await db.sale.aggregate({
    where: baseSaleWhere,
    _sum: { totalAmount: true },
    _count: true,
    _avg: { totalAmount: true },
  });

  // Get lifetime value (all time)
  const lifetimeSaleWhere: Prisma.SaleWhereInput = {
    customerId: params.customerId,
    deletedAt: null,
    ...saleExtraWhere,
  };
  if (statusWhere) {
    lifetimeSaleWhere.status = statusWhere;
  }
  if (employeeIdParam) {
    lifetimeSaleWhere.employeeId = employeeIdParam;
  }

  const lifetimeStats = await db.sale.aggregate({
    where: lifetimeSaleWhere,
    _sum: { totalAmount: true },
    _count: true,
  });

  // Get recent transactions (filtered by date range if specified)
  const recentSales = await db.sale.findMany({
    where: baseSaleWhere,
    orderBy: { saleDate: "desc" },
    ...(startDateParam || endDateParam ? {} : { take: 10 }),
    select: {
      id: true,
      saleNumber: true,
      saleDate: true,
      status: true,
      totalAmount: true,
      paymentTerm: true,
      deliveryDate: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
            },
          },
        },
      },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Get last purchase date
  const lastPurchase = await db.sale.findFirst({
    where: lifetimeSaleWhere,
    orderBy: { saleDate: "desc" },
    select: { saleDate: true },
  });

  // Calculate days since last purchase
  const daysSinceLastPurchase = lastPurchase
    ? Math.floor(
        (Date.now() - new Date(lastPurchase.saleDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Get monthly purchase frequency (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const purchaseFrequencyData = await db.sale.groupBy({
    by: ["customerId"],
    where: {
      ...lifetimeSaleWhere,
      saleDate: { gte: twelveMonthsAgo },
    },
    _count: true,
  });

  const purchaseFrequency = (purchaseFrequencyData[0]?._count || 0) / 12;

  // Get product purchase history grouped by product with volume calculation
  const saleItems = await db.saleItem.findMany({
    where: {
      sale: baseSaleWhere,
    },
    select: {
      saleId: true,
      productId: true,
      quantity: true,
      totalPrice: true,
      packageSize: true,
      packageSizeUnit: true,
      packageSizePerBox: true,
      totalPackageSizePerBox: true,
      unit: true,
      product: {
        select: {
          id: true,
          name: true,
          productCode: true,
          packageSize: true,
          packageSizeUnit: true,
          packageSizePerBox: true,
          totalPackageSizePerBox: true,
          unit: true,
        },
      },
    },
  });

  const productAggMap = new Map<
    string,
    {
      product: {
        id: string;
        name: string;
        productCode: string;
        packageSize?: number | null;
        packageSizeUnit?: string | null;
      };
      totalQuantity: number;
      totalAmount: number;
      totalVolumeLiters: number;
      volumeUnit: "L" | "KG";
      saleIds: Set<string>;
    }
  >();

  const allDistinctSaleIds = new Set<string>();

  for (const item of saleItems) {
    if (!item.productId) continue;
    if (item.saleId) {
      allDistinctSaleIds.add(item.saleId);
    }

    const { totalLitersOrKg, unit } = calculateLitersOrKg({
      quantity: item.quantity != null ? Number(item.quantity) : null,
      packageSize: item.packageSize != null ? Number(item.packageSize) : null,
      packageSizeUnit: item.packageSizeUnit,
      packageSizePerBox: item.packageSizePerBox != null ? Number(item.packageSizePerBox) : null,
      totalPackageSizePerBox: item.totalPackageSizePerBox != null ? Number(item.totalPackageSizePerBox) : null,
      unit: item.unit,
      product: item.product
        ? {
            packageSize: item.product.packageSize != null ? Number(item.product.packageSize) : null,
            packageSizeUnit: item.product.packageSizeUnit,
            packageSizePerBox: item.product.packageSizePerBox != null ? Number(item.product.packageSizePerBox) : null,
            totalPackageSizePerBox: item.product.totalPackageSizePerBox != null ? Number(item.product.totalPackageSizePerBox) : null,
            unit: item.product.unit,
          }
        : null,
    });

    const quantity = Number(item.quantity || 0);
    const amount = Number(item.totalPrice || 0);

    const existing = productAggMap.get(item.productId);
    if (existing) {
      existing.totalQuantity += quantity;
      existing.totalAmount += amount;
      existing.totalVolumeLiters = roundNumber(
        existing.totalVolumeLiters + totalLitersOrKg,
        4,
      );
      if (item.saleId) {
        existing.saleIds.add(item.saleId);
      }
    } else {
      productAggMap.set(item.productId, {
        product: {
          id: item.product?.id || item.productId,
          name: item.product?.name || "",
          productCode: item.product?.productCode || "",
          packageSize:
            item.product?.packageSize != null
              ? Number(item.product.packageSize)
              : item.packageSize != null
                ? Number(item.packageSize)
                : null,
          packageSizeUnit: item.product?.packageSizeUnit || item.packageSizeUnit || null,
        },
        totalQuantity: quantity,
        totalAmount: amount,
        totalVolumeLiters: totalLitersOrKg,
        volumeUnit: unit,
        saleIds: new Set(item.saleId ? [item.saleId] : []),
      });
    }
  }

  const topProducts = Array.from(productAggMap.values())
    .map((p) => ({
      product: p.product,
      totalQuantity: p.totalQuantity,
      totalAmount: p.totalAmount,
      totalVolumeLiters: p.totalVolumeLiters,
      volumeUnit: p.volumeUnit,
      orderCount: p.saleIds.size,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const distinctOrderCount = allDistinctSaleIds.size;

  return NextResponse.json({
    customer,
    kpi: {
      totalSales: Number(salesStats._sum.totalAmount || 0),
      orderCount: distinctOrderCount,
      averageOrderValue: Number(salesStats._avg.totalAmount || 0),
      lifetimeValue: Number(lifetimeStats._sum.totalAmount || 0),
      lifetimeOrderCount: lifetimeStats._count,
      daysSinceLastPurchase,
      purchaseFrequency,
      lastPurchaseDate: lastPurchase?.saleDate || null,
    },
    recentSales,
    topProducts,
    distinctOrderCount,
  });
}

