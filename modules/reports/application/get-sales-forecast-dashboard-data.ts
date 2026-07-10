"use server";

import { prisma } from "@/lib/db";

export type SalesForecastDashboardData = {
  employees: { id: string; name: string }[];
  data: Record<string, { month: number; forecast: number; invoice: number }[]>;
};

export async function getSalesForecastDashboardData(
  year: number,
): Promise<SalesForecastDashboardData> {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

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
    { month: number; forecast: number; invoice: number }[]
  > = {};
  for (const emp of empList) {
    data[emp.id] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      forecast: 0,
      invoice: 0,
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

  // 3. Fetch Invoices (Sales)
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

  // Filter out employees who have no forecast and no invoice for the entire year
  const activeEmpIds = new Set<string>();
  for (const emp of empList) {
    const empData = data[emp.id];
    const hasData = empData.some((d) => d.forecast > 0 || d.invoice > 0);
    if (hasData) {
      activeEmpIds.add(emp.id);
    }
  }

  // If no one has data, maybe return all or none. Let's return only those with data
  // but if the user just started the year, they might want to see someone.
  // Actually, if we filter, the list of salespersons might be empty.
  // Let's just return everyone if no one has data, or keep it filtered so it's clean.
  // Actually, let's keep it filtered.
  const finalEmployees = empList.filter((e) => activeEmpIds.has(e.id));
  
  // If finalEmployees is empty (e.g. no sales or targets yet), we should probably 
  // still return some employees so the dropdown isn't completely broken, but 
  // the current dashboard handles empty `selectedSalespersons` gracefully.

  const finalData: Record<string, { month: number; forecast: number; invoice: number }[]> = {};
  for (const emp of finalEmployees) {
    finalData[emp.id] = data[emp.id];
  }

  return { employees: finalEmployees, data: finalData };
}
