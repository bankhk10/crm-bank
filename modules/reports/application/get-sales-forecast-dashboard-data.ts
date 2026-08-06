"use server";

import { prisma } from "@/lib/db";

export type SalesForecastDashboardData = {
  employees: { id: string; name: string }[];
  data: Record<
    string,
    { month: number; forecast: number; invoice: number; lastYearInvoice: number }[]
  >;
};

export async function getSalesForecastDashboardData(
  year: number,
): Promise<SalesForecastDashboardData> {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const startLastYear = new Date(year - 1, 0, 1);
  const endLastYear = new Date(year - 1, 11, 31, 23, 59, 59);

  // 1. Fetch all employees
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, firstName: true, lastName: true, nickname: true },
    orderBy: { name: "asc" },
  });

  const empList = employees.map((e) => {
    let displayName = e.name;
    if (e.nickname) {
      displayName = e.nickname;
    } else if (e.firstName && e.lastName) {
      displayName = `${e.firstName} ${e.lastName}`;
    }
    
    return {
      id: e.id,
      name: displayName,
    };
  });

  // Initialize data structure
  const data: Record<
    string,
    { month: number; forecast: number; invoice: number; lastYearInvoice: number }[]
  > = {};
  for (const emp of empList) {
    data[emp.id] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      forecast: 0,
      invoice: 0,
      lastYearInvoice: 0,
    }));
  }

  // 2. Fetch Forecasts (SalesTargets)
  const targets = await prisma.salesTarget.findMany({
    where: { year },
    include: {
      stores: {
        include: {
          items: true,
        },
      },
    },
  });

  for (const target of targets) {
    if (!data[target.employeeId]) continue;

    let totalForecast = 0;
    for (const store of target.stores) {
      for (const item of store.items) {
        totalForecast += Number(item.targetAmount || 0);
      }
    }

    const monthIndex = target.month - 1; // Assuming month is 1-12
    if (monthIndex >= 0 && monthIndex < 12) {
      data[target.employeeId][monthIndex].forecast += totalForecast;
    }
  }

  // 3. Fetch Invoices (Sales - Current Year)
  const shipmentResult = (await prisma.$queryRaw`
    SELECT 
      s."employeeId",
      CAST(EXTRACT(MONTH FROM COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate")) AS INTEGER) as month,
      SUM(sh."totalAmount") as "amount"
    FROM "Shipment" sh
    JOIN "Sale" s ON sh."saleId" = s."id"
    WHERE sh."status" IN ('DELIVERED', 'IN_TRANSIT', 'COMPLETED')
      AND s."deletedAt" IS NULL
      AND COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate") >= ${start}
      AND COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate") <= ${end}
    GROUP BY s."employeeId", EXTRACT(MONTH FROM COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate"))
  `) as any[];

  const legacyResult = (await prisma.$queryRaw`
    SELECT 
      s."employeeId",
      CAST(EXTRACT(MONTH FROM COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate")) AS INTEGER) as month,
      SUM(s."totalAmount") as "amount"
    FROM "Sale" s
    WHERE s."deletedAt" IS NULL
      AND s."status" IN ('PAID', 'DELIVERY_COMPLETED', 'COMPLETED')
      AND NOT EXISTS (SELECT 1 FROM "Shipment" sh WHERE sh."saleId" = s."id")
      AND COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate") >= ${start}
      AND COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate") <= ${end}
    GROUP BY s."employeeId", EXTRACT(MONTH FROM COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate"))
  `) as any[];

  for (const r of shipmentResult) {
    const empId = String(r.employeeId);
    const month = Number(r.month);
    if (data[empId] && month >= 1 && month <= 12) {
      data[empId][month - 1].invoice += Number(r.amount || 0);
    }
  }

  for (const r of legacyResult) {
    const empId = String(r.employeeId);
    const month = Number(r.month);
    if (data[empId] && month >= 1 && month <= 12) {
      data[empId][month - 1].invoice += Number(r.amount || 0);
    }
  }

  // 4. Fetch Invoices (Sales - Last Year)
  const lastYearShipmentResult = (await prisma.$queryRaw`
    SELECT 
      s."employeeId",
      CAST(EXTRACT(MONTH FROM COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate")) AS INTEGER) as month,
      SUM(sh."totalAmount") as "amount"
    FROM "Shipment" sh
    JOIN "Sale" s ON sh."saleId" = s."id"
    WHERE sh."status" IN ('DELIVERED', 'IN_TRANSIT', 'COMPLETED')
      AND s."deletedAt" IS NULL
      AND COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate") >= ${startLastYear}
      AND COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate") <= ${endLastYear}
    GROUP BY s."employeeId", EXTRACT(MONTH FROM COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate"))
  `) as any[];

  const lastYearLegacyResult = (await prisma.$queryRaw`
    SELECT 
      s."employeeId",
      CAST(EXTRACT(MONTH FROM COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate")) AS INTEGER) as month,
      SUM(s."totalAmount") as "amount"
    FROM "Sale" s
    WHERE s."deletedAt" IS NULL
      AND s."status" IN ('PAID', 'DELIVERY_COMPLETED', 'COMPLETED')
      AND NOT EXISTS (SELECT 1 FROM "Shipment" sh WHERE sh."saleId" = s."id")
      AND COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate") >= ${startLastYear}
      AND COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate") <= ${endLastYear}
    GROUP BY s."employeeId", EXTRACT(MONTH FROM COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate"))
  `) as any[];

  for (const r of lastYearShipmentResult) {
    const empId = String(r.employeeId);
    const month = Number(r.month);
    if (data[empId] && month >= 1 && month <= 12) {
      data[empId][month - 1].lastYearInvoice += Number(r.amount || 0);
    }
  }

  for (const r of lastYearLegacyResult) {
    const empId = String(r.employeeId);
    const month = Number(r.month);
    if (data[empId] && month >= 1 && month <= 12) {
      data[empId][month - 1].lastYearInvoice += Number(r.amount || 0);
    }
  }

  // Filter out employees who have no forecast and no invoice for the entire year
  const activeEmpIds = new Set<string>();
  for (const emp of empList) {
    const empData = data[emp.id];
    const hasData = empData.some((d) => d.forecast > 0 || d.invoice > 0 || d.lastYearInvoice > 0);
    if (hasData) {
      activeEmpIds.add(emp.id);
    }
  }

  const finalEmployees = empList.filter((e) => activeEmpIds.has(e.id));

  const finalData: Record<
    string,
    { month: number; forecast: number; invoice: number; lastYearInvoice: number }[]
  > = {};
  for (const emp of finalEmployees) {
    finalData[emp.id] = data[emp.id];
  }

  return { employees: finalEmployees, data: finalData };
}
