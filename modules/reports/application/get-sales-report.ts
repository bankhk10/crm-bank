import { ReportType } from "../types";
import { DataAccessLevel } from "@/lib/db";
import { startOfYear, endOfYear, format } from "date-fns";
import * as repo from "../infrastructure/reports.repository";

// Helper to get team employee IDs (employees with same manager)
async function getTeamEmployeeIds(session: {
  user: { employeeId?: string | null; managerId?: string | null };
}): Promise<string[]> {
  const employeeId = session.user.employeeId;
  if (!employeeId) return [];
  const managerId = session.user.managerId;
  return repo.findTeamEmployeeIds(employeeId, managerId);
}

export async function getFilterOptions(session: any) {

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] || // Fallback
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const whereEmployee: any = { deletedAt: null };
  const whereCustomer: any = { deletedAt: null };

  if (viewScope === DataAccessLevel.VIEW_OWN) {
    if (!session.user.employeeId) throw new Error("User is not an employee");
    whereEmployee.id = session.user.employeeId;
    whereCustomer.responsibleEmployeeId = session.user.employeeId;
  } else if (viewScope === ("VIEW_TEAM" as DataAccessLevel)) {
    const teamIds = await getTeamEmployeeIds(session);
    whereEmployee.id = { in: teamIds };
    whereCustomer.responsibleEmployeeId = { in: teamIds };
  } else if (viewScope === DataAccessLevel.VIEW_DEPARTMENT) {
    if (!session.user.departmentId) throw new Error("User has no department");
    whereEmployee.departmentId = session.user.departmentId;
    whereCustomer.responsibleEmployee = {
      departmentId: session.user.departmentId,
    };
  }

  const [customers, employees, yearsResult] = await Promise.all([
    repo.findCustomersWithScope(whereCustomer),
    repo.findEmployeesWithScope(whereEmployee),
    repo.findSalesYears(),
  ]);

  // If no summary data, provide current year
  const years =
    yearsResult.length > 0
      ? yearsResult.map((y: { year: number }) => y.year)
      : [new Date().getFullYear()];

  return { customers, employees, years };
}

export async function getReportSummary(
  year: number,
  type: ReportType,
  session: any,
  entityId?: string,
) {
  if (!entityId) return null;


  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  // Build scope constraint
  const scopeConstraint: any = {};

  if (viewScope === DataAccessLevel.VIEW_OWN) {
    // If viewing employee report, entityId must be me
    if (type === "EMPLOYEE" && entityId !== session.user.employeeId) {
      throw new Error("Unauthorized query"); // Cannot view other employees
    }
    // If viewing customer report, ensure we only count MY sales
    scopeConstraint.employeeId = session.user.employeeId;
  } else if (viewScope === ("VIEW_TEAM" as DataAccessLevel)) {
    const teamIds = await getTeamEmployeeIds(session);
    if (type === "EMPLOYEE" && !teamIds.includes(entityId!)) {
      throw new Error("Unauthorized query"); // Cannot view employees outside team
    }
    scopeConstraint.employeeId = { in: teamIds };
  } else if (viewScope === DataAccessLevel.VIEW_DEPARTMENT) {
    // If viewing employee report, entityId must be in my dept
    if (type === "EMPLOYEE") {
      scopeConstraint.employee = { departmentId: session.user.departmentId };
    } else {
      // Viewing customer: filter by sales within department
      scopeConstraint.employee = { departmentId: session.user.departmentId };
    }
  }

  // 1. Get Monthly Trend
  const monthlyData = await repo.findMonthlyTrendSummary(year, {
    ...(type === "CUSTOMER"
      ? { customerId: entityId }
      : { employeeId: entityId }),
    ...scopeConstraint,
  });

  // 2. Get Product Breakdown (Top 5)
  const productData = await repo.findProductBreakdownSummary(
    year,
    {
      ...(type === "CUSTOMER"
        ? { customerId: entityId }
        : { employeeId: entityId }),
      ...scopeConstraint,
    },
    5,
  );

  // Note: productData _sum structure in typescript
  // _sum property names come from schema.

  // Enrich product names
  const productIds = productData.map((p) => p.productId);
  const products = await repo.findProductsByIds(productIds);

  const topProducts = productData.map((p) => {
    const product = products.find((prod) => prod.id === p.productId);
    return {
      name: product?.name || "Unknown Product",
      code: product?.productCode || "",
      brand: p.brand || "-",
      amount: Number(p._sum.totalAmount || 0),
      quantity: Number(p._sum.quantity || 0),
    };
  });

  // 3. Calculate Totals
  const totalSales = monthlyData.reduce(
    (acc, curr) => acc + Number(curr._sum.totalAmount || 0),
    0,
  );
  const totalOrders = monthlyData.reduce(
    (acc, curr) => acc + Number(curr._sum.orderCount || 0),
    0,
  );

  // Refine monthly data for chart
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const found = monthlyData.find((m) => m.month === monthNum);
    return {
      month: format(new Date(year, i, 1), "MMM"),
      sales: Number(found?._sum.totalAmount || 0),
      orders: Number(found?._sum.orderCount || 0),
    };
  });

  return {
    totalSales,
    totalOrders,
    chartData,
    topProducts,
  };
}

export async function getOrderHistory(
  year: number,
  type: ReportType,
  session: any,
  entityId?: string,
  limit: number = 10,
) {
  if (!entityId) return [];


  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const scopeConstraint: any = {};
  if (viewScope === DataAccessLevel.VIEW_OWN) {
    if (type === "EMPLOYEE" && entityId !== session.user.employeeId)
      throw new Error("Unauthorized");
    scopeConstraint.employeeId = session.user.employeeId;
  } else if (viewScope === ("VIEW_TEAM" as DataAccessLevel)) {
    const teamIds = await getTeamEmployeeIds(session);
    if (type === "EMPLOYEE" && !teamIds.includes(entityId!))
      throw new Error("Unauthorized");
    scopeConstraint.employeeId = { in: teamIds };
  } else if (viewScope === DataAccessLevel.VIEW_DEPARTMENT) {
    scopeConstraint.employee = { departmentId: session.user.departmentId };
  }

  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 0, 1));

  const orders = await repo.findSaleOrderHistory(
    startDate,
    endDate,
    {
      ...(type === "CUSTOMER"
        ? { customerId: entityId }
        : { employeeId: entityId }),
      ...scopeConstraint,
    },
    limit,
  );

  const mappedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }));

  return mappedOrders;
}
