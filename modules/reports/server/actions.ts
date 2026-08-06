"use server";

import * as app from "../application";
import { DateRangeFilter, ReportType } from "../types";
import { auth } from "@/modules/auth/infrastructure/next-auth";

async function getAuthSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

// ==========================================
// Main Reports
// ==========================================

export async function getTimeSalesReportAction(filter: DateRangeFilter) {
  const session = await getAuthSession();
  return app.getTimeSalesReport(filter, session);
}

export async function getProductSalesReportAction(filter: DateRangeFilter) {
  const session = await getAuthSession();
  return app.getProductSalesReport(filter, session);
}

export async function getProductGroupSalesReportAction(
  filter: DateRangeFilter,
) {
  const session = await getAuthSession();
  return app.getProductGroupSalesReport(filter, session);
}

export async function getCustomerSalesReportAction(filter: DateRangeFilter) {
  const session = await getAuthSession();
  return app.getCustomerSalesReport(filter, session);
}

export async function getSalespersonSalesReportAction(filter: DateRangeFilter) {
  const session = await getAuthSession();
  return app.getSalespersonSalesReport(filter, session);
}

export async function getExecutiveDashboardReportAction(filter: DateRangeFilter) {
  const session = await getAuthSession();
  return app.getExecutiveDashboardReport(filter, session);
}

// ==========================================
// Report Filters & Helpers
// ==========================================

export async function getReportFilterOptionsAction() {
  const session = await getAuthSession();
  return app.getReportFilterOptions(session);
}

export async function getAllCustomersForReportAction() {
  const session = await getAuthSession();
  return app.getAllCustomersForReport(session);
}

export async function getAllSalespersonsForReportAction() {
  const session = await getAuthSession();
  return app.getAllSalespersonsForReport(session);
}

// ==========================================
// Sales Report Specific
// ==========================================

export async function getFilterOptionsAction() {
  const session = await getAuthSession();
  return app.getFilterOptions(session);
}

export async function getReportSummaryAction(
  year: number,
  type: ReportType,
  entityId?: string,
) {
  const session = await getAuthSession();
  return app.getReportSummary(year, type, session, entityId);
}

export async function getOrderHistoryAction(
  year: number,
  type: ReportType,
  entityId?: string,
  limit?: number,
) {
  const session = await getAuthSession();
  return app.getOrderHistory(year, type, session, entityId, limit);
}

export async function getMonthlySalesOverviewAction(year: number) {
  const session = await getAuthSession();
  return app.getMonthlySalesOverview(year, session);
}

export async function getSalespersonDetailReportAction(
  employeeId: string,
  filter?: DateRangeFilter,
) {
  const session = await getAuthSession();
  return app.getSalespersonDetailReport(employeeId, session, filter);
}
