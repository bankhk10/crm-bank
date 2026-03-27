import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

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
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");

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
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              transactionDate: true,
              type: true,
              amount: true,
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

  // Build date filter for sales
  const dateFilter: { saleDate?: { gte?: Date; lte?: Date } } = {};
  if (startDateParam) {
    dateFilter.saleDate = { gte: new Date(startDateParam) };
  }
  if (endDateParam) {
    dateFilter.saleDate = {
      ...dateFilter.saleDate,
      lte: new Date(endDateParam),
    };
  }

  // Get sales statistics
  const salesStats = await db.sale.aggregate({
    where: {
      customerId: params.customerId,
      deletedAt: null,
      status: {
        in: [
          "APPROVED",
          "AWAITING_PAYMENT",
          "PAID",
          "AWAITING_DELIVERY",
          "DELIVERED",
          "DELIVERY_COMPLETED",
          "COMPLETED",
        ],
      },
      ...dateFilter,
    },
    _sum: { totalAmount: true },
    _count: true,
    _avg: { totalAmount: true },
  });

  // Get lifetime value (all time)
  const lifetimeStats = await db.sale.aggregate({
    where: {
      customerId: params.customerId,
      deletedAt: null,
      status: {
        in: [
          "APPROVED",
          "AWAITING_PAYMENT",
          "PAID",
          "AWAITING_DELIVERY",
          "DELIVERED",
          "DELIVERY_COMPLETED",
          "COMPLETED",
        ],
      },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Get recent transactions (last 10)
  const recentSales = await db.sale.findMany({
    where: {
      customerId: params.customerId,
      deletedAt: null,
    },
    orderBy: { saleDate: "desc" },
    take: 10,
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
    where: {
      customerId: params.customerId,
      deletedAt: null,
      status: {
        in: [
          "APPROVED",
          "AWAITING_PAYMENT",
          "PAID",
          "AWAITING_DELIVERY",
          "DELIVERED",
          "DELIVERY_COMPLETED",
          "COMPLETED",
        ],
      },
    },
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
      customerId: params.customerId,
      deletedAt: null,
      saleDate: { gte: twelveMonthsAgo },
      status: {
        in: [
          "APPROVED",
          "AWAITING_PAYMENT",
          "PAID",
          "AWAITING_DELIVERY",
          "DELIVERED",
          "DELIVERY_COMPLETED",
          "COMPLETED",
        ],
      },
    },
    _count: true,
  });

  const purchaseFrequency = (purchaseFrequencyData[0]?._count || 0) / 12;

  // Get product purchase history grouped by product
  const productPurchaseHistory = await db.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        customerId: params.customerId,
        deletedAt: null,
        status: {
          in: [
            "APPROVED",
            "AWAITING_PAYMENT",
            "PAID",
            "AWAITING_DELIVERY",
            "DELIVERED",
            "DELIVERY_COMPLETED",
            "COMPLETED",
          ],
        },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    _count: true,
    orderBy: { _sum: { totalPrice: "desc" } },
  });

  // Get product details for product purchase history
  const productIds = productPurchaseHistory.map((p) => p.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, productCode: true, packageSize: true, packageSizeUnit: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Helper for unit conversion to liters
  const convertToLiters = (value: number, unit?: string | null): number => {
    if (!unit) return 0;
    const u = unit.toUpperCase().trim();
    if (u === "L" || u === "KG") return value;
    if (u === "ML" || u === "CC" || u === "G") return value / 1000;
    return 0;
  };

  const topProducts = productPurchaseHistory.map((p) => {
    const product = productMap.get(p.productId);
    const totalQuantity = Number(p._sum.quantity || 0);
    
    // Calculate volume based on product package size and quantity
    const packageSize = Number(product?.packageSize || 0);
    const totalVolumeLiters = convertToLiters(
      totalQuantity * packageSize,
      product?.packageSizeUnit
    );

    return {
      product,
      totalQuantity,
      totalAmount: Number(p._sum.totalPrice || 0),
      totalVolumeLiters,
      orderCount: p._count,
    };
  });

  return NextResponse.json({
    customer,
    kpi: {
      totalSales: Number(salesStats._sum.totalAmount || 0),
      orderCount: salesStats._count,
      averageOrderValue: Number(salesStats._avg.totalAmount || 0),
      lifetimeValue: Number(lifetimeStats._sum.totalAmount || 0),
      lifetimeOrderCount: lifetimeStats._count,
      daysSinceLastPurchase,
      purchaseFrequency,
      lastPurchaseDate: lastPurchase?.saleDate || null,
    },
    recentSales,
    topProducts,
  });
}

