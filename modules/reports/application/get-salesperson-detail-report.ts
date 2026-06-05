import * as repo from "../infrastructure/reports.repository";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DataAccessLevel } from "@/lib/db";
import { buildScopeFilter } from "./helpers";
import type { SalespersonDetailReportData } from "../types";

// ============================================
// SALESPERSON DETAIL REPORT
// ============================================

export async function getSalespersonDetailReport(employeeId: string, session: any): Promise<SalespersonDetailReportData | null> {

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  // Scope check: ensure user can view this employee
  const scopeFilter = await buildScopeFilter(session, viewScope);
  if (viewScope === DataAccessLevel.VIEW_OWN) {
    if (session.user.employeeId !== employeeId) throw new Error("Unauthorized");
  }

  // 1. Employee detail
  const employee = await repo.findEmployeeDetailById(employeeId);
  if (!employee) return null;

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  // 2. KPI (current year)
  const [
    yearKpi,
    monthKpi,
    yearCustomerCount,
    monthCustomerCount,
    lastSale,
    salesTargets,
    pointHistory,
    recentSales,
    statusBreakdown,
  ] = await Promise.all([
    repo.aggregateSalesKpiByEmployee(employeeId, yearStart, yearEnd),
    repo.aggregateSalesKpiByEmployee(employeeId, monthStart, monthEnd),
    repo.countUniqueCustomersByEmployee(employeeId, yearStart, yearEnd),
    repo.countUniqueCustomersByEmployee(employeeId, monthStart, monthEnd),
    repo.getLastSaleDateByEmployee(employeeId),
    repo.findSalesTargetsForEmployee(employeeId, currentYear),
    repo.findPointHistoryByEmployee(employeeId, 50),
    repo.findRecentSalesByEmployee(employeeId, 30),
    repo.countSalesByStatusForEmployee(employeeId, yearStart, yearEnd),
  ]);

  // 3. Monthly sales data for this year (aggregate from raw sales)
  const rawMonthlySales = await repo.groupMonthlySalesByEmployee(
    employeeId,
    currentYear,
  );

  // Aggregate into monthly buckets
  const monthlyMap = new Map<
    number,
    { sales: number; orders: number; customers: Set<string> }
  >();
  for (let m = 0; m < 12; m++) {
    monthlyMap.set(m, { sales: 0, orders: 0, customers: new Set() });
  }

  // Since groupBy returns by saleDate, we need to aggregate into months
  for (const row of rawMonthlySales) {
    const month = new Date(row.saleDate).getMonth();
    const entry = monthlyMap.get(month)!;
    entry.sales += Number(row._sum.totalAmount || 0);
    entry.orders += row._count;
  }

  // For customer count per month, we need separate query
  const monthlyCustomerData = await repo.groupSalesData({
    by: ["customerId", "saleDate"],
    where: {
      employeeId,
      saleDate: { gte: yearStart, lte: yearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
  });

  for (const row of monthlyCustomerData) {
    const month = new Date(row.saleDate).getMonth();
    const entry = monthlyMap.get(month);
    if (entry) entry.customers.add(row.customerId);
  }

  // 4. Build sales targets map (month -> target amount)
  const targetsByMonth = new Map<number, number>();
  for (const target of salesTargets) {
    let totalTargetAmount = 0;
    for (const store of target.stores) {
      for (const item of store.items) {
        totalTargetAmount += Number(item.targetAmount || 0);
      }
    }
    targetsByMonth.set(target.month, totalTargetAmount);
  }

  // Current month target
  const currentMonthTarget = targetsByMonth.get(currentMonth + 1) || 0; // SalesTarget month is 1-indexed

  // Calculate achievement
  const currentMonthSales = Number(monthKpi._sum.totalAmount || 0);
  const achievementPercent =
    currentMonthTarget > 0
      ? Math.round((currentMonthSales / currentMonthTarget) * 100)
      : 0;

  // Monthly performance array
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const monthlyPerformance = Array.from({ length: 12 }, (_, i) => {
    const entry = monthlyMap.get(i)!;
    const target = targetsByMonth.get(i + 1) || 0; // month is 1-indexed in SalesTarget
    return {
      month: thaiMonths[i],
      monthShort: thaiMonths[i].slice(0, 3) + ".",
      monthIndex: i + 1,
      target,
      actual: entry.sales,
      achievementPercent: target > 0 ? Math.round((entry.sales / target) * 100) : 0,
      orders: entry.orders,
      customers: entry.customers.size,
    };
  });

  // 5. Product breakdown
  const productSales = await repo.groupProductSalesByEmployee(
    employeeId,
    yearStart,
    yearEnd,
  );

  const productIds = productSales.map((p) => p.productId);
  const products =
    productIds.length > 0
      ? await repo.findManyProductsData({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            productCode: true,
            brand: true,
            tradeNameGroup: { select: { description: true } },
          },
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const totalProductSales = productSales.reduce(
    (sum, p) => sum + Number(p._sum.totalPrice || 0),
    0,
  );

  const productBreakdown = productSales.map((ps) => {
    const product = productMap.get(ps.productId);
    const sales = Number(ps._sum.totalPrice || 0);
    return {
      productId: ps.productId,
      productCode: product?.productCode || "-",
      productName: product?.name || "Unknown",
      brand: (product as any)?.brand || "-",
      productGroup: (product as any)?.tradeNameGroup?.description || "-",
      quantity: Number(ps._sum.quantity || 0),
      revenue: sales,
      contribution: totalProductSales > 0 ? Math.round((sales / totalProductSales) * 100) : 0,
      orderCount: ps._count,
    };
  });

  // 6. Customer breakdown
  const customerSales = await repo.groupCustomerSalesByEmployee(
    employeeId,
    yearStart,
    yearEnd,
  );

  const customerIds = customerSales.map((c) => c.customerId);
  const customers =
    customerIds.length > 0
      ? await repo.findManyCustomersData({
          where: { id: { in: customerIds } },
          select: {
            id: true,
            name: true,
            customerCode: true,
            customerType: true,
            province: true,
            region: true,
            status: true,
            responsibleEmployeeId: true,
          },
        })
      : [];
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // Get last sale per customer for this employee
  const customerLastSales = await repo.findManySalesData({
    where: {
      employeeId,
      customerId: { in: customerIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    orderBy: { saleDate: "desc" },
    distinct: ["customerId"],
    select: { customerId: true, saleDate: true },
  });
  const lastSaleMap = new Map(
    customerLastSales.map((s) => [s.customerId, s.saleDate]),
  );

  const customerBreakdown = customerSales.map((cs) => {
    const customer = customerMap.get(cs.customerId);
    return {
      customerId: cs.customerId,
      customerCode: customer?.customerCode || "-",
      customerName: customer?.name || "Unknown",
      customerType: customer?.customerType || "-",
      province: customer?.province || "-",
      region: customer?.region || "-",
      status: customer?.status || "-",
      isResponsible: customer?.responsibleEmployeeId === employeeId,
      orders: cs._count,
      revenue: Number(cs._sum.totalAmount || 0),
      lastOrderDate: lastSaleMap.get(cs.customerId)
        ? format(lastSaleMap.get(cs.customerId)!, "dd/MM/yyyy")
        : "-",
    };
  });

  // 7. Status breakdown
  const saleStatusLabels: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    PENDING_APPROVAL: "รออนุมัติ",
    APPROVED: "อนุมัติแล้ว",
    REJECTED: "ไม่อนุมัติ",
    AWAITING_PAYMENT: "รอชำระเงิน",
    PAID: "ชำระเงินแล้ว",
    AWAITING_DELIVERY: "รอจัดส่ง",
    DELIVERED: "ระหว่างขนส่ง",
    DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
    COMPLETED: "เสร็จสิ้น",
    CANCELLED: "ยกเลิก",
    EXPIRED: "หมดอายุ",
    OVERDUE: "เลยกำหนด",
    WAITING_FOR_CORRECTION: "รอแก้ไข",
  };

  const salesStatusData = statusBreakdown.map((sb) => ({
    status: sb.status,
    statusLabel: saleStatusLabels[sb.status] || sb.status,
    count: sb._count,
    amount: Number(sb._sum.totalAmount || 0),
  }));

  // 8. Point history
  const pointHistoryData = pointHistory.map((ph) => ({
    id: ph.id,
    productName: ph.product.name,
    productCode: ph.product.productCode,
    saleNumber: ph.sale.saleNumber,
    saleDate: format(ph.sale.saleDate, "dd/MM/yyyy"),
    quantity: ph.quantity,
    pointPerUnit: ph.pointPerUnit,
    totalPoints: ph.totalPoints,
    createdAt: format(ph.createdAt, "dd/MM/yyyy HH:mm"),
  }));

  // 9. Recent sales
  const recentSalesData = recentSales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    saleDate: format(s.saleDate, "dd/MM/yyyy"),
    saleDateRaw: s.saleDate.toISOString(),
    status: s.status,
    statusLabel: saleStatusLabels[s.status] || s.status,
    totalAmount: Number(s.totalAmount),
    customerName: s.customer.name,
    customerCode: s.customer.customerCode,
    customerId: s.customer.id,
  }));

  // 10. Responsible customers
  const responsibleCustomers = employee.responsibleCustomers.map((c) => ({
    id: c.id,
    customerCode: c.customerCode,
    name: c.name,
    customerType: c.customerType,
    province: c.province || "-",
    region: c.region || "-",
    status: c.status,
  }));

  const yearTotalSales = Number(yearKpi._sum.totalAmount || 0);
  const yearOrderCount = yearKpi._count;

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      employeeCode: employee.employeeCode,
      status: employee.status,
      positionTitle: employee.positionTitle,
      roleTitle: employee.roleTitle,
      responsibilityArea: employee.responsibilityArea,
      company: employee.company ? { name: employee.company.name } : null,
      department: employee.department ? { name: employee.department.name } : null,
      manager: employee.manager ? { name: employee.manager.name } : null,
      province: employee.province,
      district: employee.district,
      subdistrict: employee.subdistrict,
      addressLine: employee.addressLine,
      postalCode: employee.postalCode,
    },
    kpi: {
      yearTotalSales,
      yearOrderCount,
      yearCustomerCount,
      yearAvgOrderValue: yearOrderCount > 0 ? yearTotalSales / yearOrderCount : 0,
      monthTotalSales: currentMonthSales,
      monthOrderCount: monthKpi._count,
      monthCustomerCount,
      currentMonthTarget,
      achievementPercent,
      totalPoints: employee.pointSummary?.totalPoints || 0,
      lastSaleDate: lastSale?.saleDate
        ? format(lastSale.saleDate, "dd/MM/yyyy")
        : null,
    },
    monthlyPerformance,
    productBreakdown,
    customerBreakdown,
    salesStatusData,
    pointHistory: pointHistoryData,
    recentSales: recentSalesData,
    responsibleCustomers,
    currentYear,
  };
}
