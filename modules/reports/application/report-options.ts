import { db as prisma } from "@/lib/db";
import * as repo from "../infrastructure/reports.repository";
import { format, differenceInDays } from "date-fns";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { DataAccessLevel } from "@/lib/db";
import { getTeamEmployeeIds } from "./helpers";

// REPORT FILTER OPTIONS
// ============================================

export async function getReportFilterOptions() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
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

  const [customers, employees, products, productGroups] = await Promise.all([
    repo.findManyCustomersData({
      where: whereCustomer,
      select: { id: true, name: true, customerCode: true, customerType: true },
      orderBy: { name: "asc" },
    }),
    repo.findManyEmployeesData({
      where: whereEmployee,
      select: { id: true, name: true, employeeCode: true },
      orderBy: { name: "asc" },
    }),
    repo.findManyProductsData({
      where: { deletedAt: null },
      select: { id: true, name: true, productCode: true, productGroup: true },
      orderBy: { name: "asc" },
    }),
    prisma.tradeNameGroup
      .findMany({
        where: { deletedAt: null },
        select: { code: true, description: true },
        orderBy: { code: "asc" },
      })
      .then((groups) =>
        groups.map((g) => ({ value: g.code, label: g.description })),
      ),
  ]);

  // Get available years from sales data
  const yearData = await repo.findManySalesData({
    select: { saleDate: true },
    distinct: ["saleDate"],
    orderBy: { saleDate: "asc" },
    take: 1,
  });

  const earliestYear =
    yearData[0]?.saleDate.getFullYear() || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = earliestYear; y <= currentYear; y++) {
    years.push(y);
  }

  return {
    customers,
    employees,
    products,
    productGroups,
    years: years.reverse(),
  };
}

// ============================================
// CUSTOMER LIST FOR CUSTOMER REPORT PAGE
// ============================================

export interface CustomerListItem {
  id: string;
  code: string;
  name: string;
  type: string;
  province: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  purchaseFrequency: number;
  lifetimeValue: number;
  lastPurchaseDate?: string;
}

export async function getAllCustomersForReport(): Promise<CustomerListItem[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const whereCustomer: any = {
    deletedAt: null,
    status: "ACTIVE",
  };
  const whereSales: any = {
    deletedAt: null,
    status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
  };

  if (viewScope === DataAccessLevel.VIEW_OWN) {
    if (!session.user.employeeId) throw new Error("User is not an employee");
    whereCustomer.responsibleEmployeeId = session.user.employeeId;
    whereSales.employeeId = session.user.employeeId;
  } else if (viewScope === ("VIEW_TEAM" as DataAccessLevel)) {
    const teamIds = await getTeamEmployeeIds(session);
    whereCustomer.responsibleEmployeeId = { in: teamIds };
    whereSales.employeeId = { in: teamIds };
  } else if (viewScope === DataAccessLevel.VIEW_DEPARTMENT) {
    if (!session.user.departmentId) throw new Error("User has no department");
    whereCustomer.responsibleEmployee = {
      departmentId: session.user.departmentId,
    };
    whereSales.employee = { departmentId: session.user.departmentId };
  }

  // Get all customers with their sales data
  const customers = await repo.findManyCustomersData({
    where: whereCustomer,
    select: {
      id: true,
      customerCode: true,
      name: true,
      customerType: true,
      province: true,
      createdAt: true,
      sales: {
        where: whereSales,
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
      _count: {
        select: {
          sales: {
            where: whereSales,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const customerIds = customers.map((c) => c.id);

  // Get lifetime sales for all customers
  const lifetimeSales = await repo.groupSalesData({
    by: ["customerId"],
    where: {
      customerId: { in: customerIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...whereSales, // Apply scope to lifetime sales aggregation too
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const salesMap = new Map(
    lifetimeSales.map((s) => [
      s.customerId,
      {
        totalSales: Number(s._sum.totalAmount || 0),
        orderCount: s._count,
      },
    ]),
  );

  // Calculate months since customer creation for purchase frequency
  const now = new Date();

  return customers.map((customer) => {
    const salesData = salesMap.get(customer.id) || {
      totalSales: 0,
      orderCount: 0,
    };

    const monthsSinceCreation = Math.max(
      1,
      differenceInDays(now, customer.createdAt) / 30,
    );

    return {
      id: customer.id,
      code: customer.customerCode,
      name: customer.name,
      type: customer.customerType,
      province: customer.province || "-",
      totalSales: salesData.totalSales,
      orderCount: salesData.orderCount,
      avgOrderValue:
        salesData.orderCount > 0
          ? salesData.totalSales / salesData.orderCount
          : 0,
      purchaseFrequency: salesData.orderCount / monthsSinceCreation,
      lifetimeValue: salesData.totalSales,
      lastPurchaseDate: customer.sales[0]?.saleDate
        ? format(customer.sales[0].saleDate, "dd/MM/yyyy")
        : undefined,
    };
  });
}

// ============================================
// SALESPERSON LIST FOR SALESPERSON REPORT PAGE
// ============================================

export interface SalespersonListItem {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  customerCount: number;
  totalPoints: number;
  lastSaleDate?: string;
}

export async function getAllSalespersonsForReport(): Promise<
  SalespersonListItem[]
> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const whereSales: any = {
    deletedAt: null,
    status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
  };

  if (viewScope === DataAccessLevel.VIEW_OWN) {
    if (!session.user.employeeId) throw new Error("User is not an employee");
    whereSales.employeeId = session.user.employeeId;
  } else if (viewScope === ("VIEW_TEAM" as DataAccessLevel)) {
    const teamIds = await getTeamEmployeeIds(session);
    whereSales.employeeId = { in: teamIds };
  } else if (viewScope === DataAccessLevel.VIEW_DEPARTMENT) {
    if (!session.user.departmentId) throw new Error("User has no department");
    whereSales.employee = { departmentId: session.user.departmentId };
  }

  // Get all employees who have made sales
  const employeeSales = await repo.groupSalesData({
    by: ["employeeId"],
    where: whereSales,
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const employeeIds = employeeSales.map((e) => e.employeeId);

  // Get employee details
  const employees = await repo.findManyEmployeesData({
    where: {
      id: { in: employeeIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      department: { select: { name: true } },
      pointSummary: { select: { totalPoints: true } },
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          // No need to add scope here explicitly if product access is not scoped,
          // but we are finding employees.
          // Sales relation in employee should be filtered?
          // If we are listing salespersons, we show THEIR last sale date.
          // If I can see the salesperson, I can see their last sale date.
          // The whereSales logic above filtered *which* employees are returned.
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
    },
  });

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Get customer count per employee
  const customerCounts = await repo.groupSalesData({
    by: ["employeeId", "customerId"],
    where: {
      employeeId: { in: employeeIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      // Scope filter?
      // employeeIds are already filtered by scope.
    },
  });

  const customerCountMap = new Map<string, Set<string>>();
  for (const cc of customerCounts) {
    if (!customerCountMap.has(cc.employeeId)) {
      customerCountMap.set(cc.employeeId, new Set());
    }
    customerCountMap.get(cc.employeeId)!.add(cc.customerId);
  }

  return employeeSales.map((es) => {
    const employee = employeeMap.get(es.employeeId);
    const totalSales = Number(es._sum.totalAmount || 0);
    const orderCount = es._count;

    return {
      id: es.employeeId,
      name: employee?.name || "Unknown",
      employeeCode: employee?.employeeCode || "-",
      department: employee?.department?.name || "-",
      totalSales,
      orderCount,
      avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
      customerCount: customerCountMap.get(es.employeeId)?.size || 0,
      totalPoints: employee?.pointSummary?.totalPoints || 0,
      lastSaleDate: employee?.sales[0]?.saleDate
        ? format(employee.sales[0].saleDate, "dd/MM/yyyy")
        : undefined,
    };
  });
}
