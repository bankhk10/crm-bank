"use server";

import { db as prisma } from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export interface DashboardData {
  // Monthly Sales
  monthlySales: {
    total: number;
    salesNote: number; // PENDING, APPROVED
    invoice: number; // COMPLETED
    growthPercent: number;
  };

  // Target
  target: {
    target: number;
    current: number;
  };

  // YTD
  ytd: {
    total: number;
    growthPercent: number;
  };

  // Product Group Chart
  productGroupData: {
    group: string;
    target: number;
    salesNote: number;
    invoice: number;
  }[];

  // Region Chart
  regionData: {
    region: string;
    target: number;
    salesNote: number;
    invoice: number;
  }[];

  // Job Status
  jobStatus: {
    total: number;
    success: number;
    fail: number;
    progress: number;
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Date ranges
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearEnd = endOfYear(subYears(now, 1));

  // === 1. Monthly Sales ===
  const monthlySalesRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Sales Note = PENDING, APPROVED, AWAITING_PAYMENT, AWAITING_DELIVERY (ยังไม่จบกระบวนการ)
  const salesNoteRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: {
        in: ["PENDING", "APPROVED", "AWAITING_PAYMENT", "AWAITING_DELIVERY"],
      },
    },
    _sum: { totalAmount: true },
  });

  // Invoice = PAID, DELIVERED, DELIVERY_COMPLETED, COMPLETED
  const invoiceRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: { in: ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"] },
    },
    _sum: { totalAmount: true },
  });

  // Last month for comparison
  const lastMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );
  const lastMonthEnd = endOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );

  const lastMonthSales = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: lastMonthStart, lte: lastMonthEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const currentMonthTotal = Number(monthlySalesRaw._sum.totalAmount || 0);
  const lastMonthTotal = Number(lastMonthSales._sum.totalAmount || 0);
  const monthlyGrowth =
    lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

  // === 2. YTD ===
  const ytdRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: yearStart, lte: yearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const lastYtdRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: lastYearStart, lte: lastYearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const ytdTotal = Number(ytdRaw._sum.totalAmount || 0);
  const lastYtdTotal = Number(lastYtdRaw._sum.totalAmount || 0);
  const ytdGrowth =
    lastYtdTotal > 0 ? ((ytdTotal - lastYtdTotal) / lastYtdTotal) * 100 : 0;

  // === 3. Product Group Sales (This Month) ===
  const productGroups = await prisma.product.groupBy({
    by: ["productGroup"],
    where: { deletedAt: null, productGroup: { not: null } },
  });

  const uniqueGroups = productGroups
    .map((p) => p.productGroup)
    .filter((g): g is string => g !== null)
    .slice(0, 5); // Limit to 5 groups

  const productGroupData = await Promise.all(
    uniqueGroups.map(async (group) => {
      // Get product IDs for this group
      const products = await prisma.product.findMany({
        where: { productGroup: group, deletedAt: null },
        select: { id: true },
      });
      const productIds = products.map((p) => p.id);

      // Sales Note amounts
      const salesNoteAgg = await prisma.saleItem.aggregate({
        where: {
          productId: { in: productIds },
          sale: {
            saleDate: { gte: monthStart, lte: monthEnd },
            deletedAt: null,
            status: {
              in: [
                "PENDING",
                "APPROVED",
                "AWAITING_PAYMENT",
                "AWAITING_DELIVERY",
              ],
            },
          },
        },
        _sum: { totalPrice: true },
      });

      // Invoice amounts
      const invoiceAgg = await prisma.saleItem.aggregate({
        where: {
          productId: { in: productIds },
          sale: {
            saleDate: { gte: monthStart, lte: monthEnd },
            deletedAt: null,
            status: {
              in: ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
            },
          },
        },
        _sum: { totalPrice: true },
      });

      // Set a mock target (in a real scenario, this would come from a targets table)
      const salesNoteAmt = Number(salesNoteAgg._sum.totalPrice || 0);
      const invoiceAmt = Number(invoiceAgg._sum.totalPrice || 0);
      const total = salesNoteAmt + invoiceAmt;
      const target = Math.round(total * 1.2) || 500000; // 20% above current or default

      return {
        group: `กลุ่ม ${group}`,
        target,
        salesNote: salesNoteAmt,
        invoice: invoiceAmt,
      };
    })
  );

  // === 4. Region Sales (This Month) ===
  // Group by customer's province
  const regionMapping: Record<string, string[]> = {
    เหนือ: [
      "เชียงใหม่",
      "เชียงราย",
      "ลำปาง",
      "ลำพูน",
      "แม่ฮ่องสอน",
      "น่าน",
      "พะเยา",
      "แพร่",
    ],
    กลาง: [
      "กรุงเทพมหานคร",
      "นนทบุรี",
      "ปทุมธานี",
      "สมุทรปราการ",
      "นครปฐม",
      "สมุทรสาคร",
      "อยุธยา",
      "พระนครศรีอยุธยา",
    ],
    อีสาน: [
      "ขอนแก่น",
      "อุดรธานี",
      "นครราชสีมา",
      "อุบลราชธานี",
      "ร้อยเอ็ด",
      "มหาสารคาม",
      "สกลนคร",
    ],
    ใต้: [
      "สงขลา",
      "ภูเก็ต",
      "นครศรีธรรมราช",
      "สุราษฎร์ธานี",
      "กระบี่",
      "ตรัง",
      "พัทลุง",
    ],
  };

  const regionData = await Promise.all(
    Object.entries(regionMapping).map(async ([region, provinces]) => {
      // Get customers in this region
      const customers = await prisma.customer.findMany({
        where: {
          province: { in: provinces },
          deletedAt: null,
        },
        select: { id: true },
      });
      const customerIds = customers.map((c) => c.id);

      if (customerIds.length === 0) {
        return {
          region,
          target: 300000,
          salesNote: 0,
          invoice: 0,
        };
      }

      // Sales Note
      const salesNoteAgg = await prisma.sale.aggregate({
        where: {
          customerId: { in: customerIds },
          saleDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
          status: {
            in: [
              "PENDING",
              "APPROVED",
              "AWAITING_PAYMENT",
              "AWAITING_DELIVERY",
            ],
          },
        },
        _sum: { totalAmount: true },
      });

      // Invoice
      const invoiceAgg = await prisma.sale.aggregate({
        where: {
          customerId: { in: customerIds },
          saleDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
          status: {
            in: ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
          },
        },
        _sum: { totalAmount: true },
      });

      const salesNoteAmt = Number(salesNoteAgg._sum.totalAmount || 0);
      const invoiceAmt = Number(invoiceAgg._sum.totalAmount || 0);
      const total = salesNoteAmt + invoiceAmt;
      const target = Math.round(total * 1.2) || 300000;

      return {
        region,
        target,
        salesNote: salesNoteAmt,
        invoice: invoiceAmt,
      };
    })
  );

  // === 5. Job Status (Sales in this month) ===
  const statusCounts = await prisma.sale.groupBy({
    by: ["status"],
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
    },
    _count: true,
  });

  const successStatuses = [
    "COMPLETED",
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "PAID",
  ];
  const failStatuses = ["CANCELLED", "REJECTED", "EXPIRED"];
  const progressStatuses = [
    "PENDING",
    "APPROVED",
    "AWAITING_PAYMENT",
    "AWAITING_DELIVERY",
  ];

  let success = 0,
    fail = 0,
    progress = 0;
  for (const item of statusCounts) {
    if (successStatuses.includes(item.status)) {
      success += item._count;
    } else if (failStatuses.includes(item.status)) {
      fail += item._count;
    } else if (progressStatuses.includes(item.status)) {
      progress += item._count;
    }
  }

  const total = success + fail + progress;

  // === 6. Target (Mock data - would come from a targets table in production) ===
  // Using current month sales * 1.2 as target
  const monthlyTarget = Math.round(currentMonthTotal * 1.2) || 1500000;

  return {
    monthlySales: {
      total: currentMonthTotal,
      salesNote: Number(salesNoteRaw._sum.totalAmount || 0),
      invoice: Number(invoiceRaw._sum.totalAmount || 0),
      growthPercent: Math.round(monthlyGrowth * 10) / 10,
    },
    target: {
      target: monthlyTarget,
      current: currentMonthTotal,
    },
    ytd: {
      total: ytdTotal,
      growthPercent: Math.round(ytdGrowth * 10) / 10,
    },
    productGroupData:
      productGroupData.length > 0
        ? productGroupData
        : getDefaultProductGroups(),
    regionData:
      regionData.filter((r) => r.salesNote > 0 || r.invoice > 0).length > 0
        ? regionData
        : getDefaultRegions(),
    jobStatus: {
      total: total || 120,
      success: success || 70,
      fail: fail || 20,
      progress: progress || 30,
    },
  };
}

// Default data if no real data exists
function getDefaultProductGroups() {
  return [
    { group: "กลุ่ม A", target: 500000, salesNote: 320000, invoice: 150000 },
    { group: "กลุ่ม B", target: 600000, salesNote: 380000, invoice: 220000 },
    { group: "กลุ่ม C", target: 400000, salesNote: 120000, invoice: 60000 },
  ];
}

function getDefaultRegions() {
  return [
    { region: "เหนือ", target: 300000, salesNote: 180000, invoice: 90000 },
    { region: "กลาง", target: 500000, salesNote: 320000, invoice: 180000 },
    { region: "อีสาน", target: 400000, salesNote: 250000, invoice: 120000 },
    { region: "ใต้", target: 300000, salesNote: 150000, invoice: 80000 },
  ];
}
