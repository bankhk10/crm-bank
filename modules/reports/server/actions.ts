"use server";

import * as app from "../application";
import { DateRangeFilter, ReportType } from "../types";

// ==========================================
// Main Reports
// ==========================================

export async function getTimeSalesReportAction(filter: DateRangeFilter) {
  return app.getTimeSalesReport(filter);
}

export async function getProductSalesReportAction(filter: DateRangeFilter) {
  return app.getProductSalesReport(filter);
}

export async function getProductGroupSalesReportAction(
  filter: DateRangeFilter,
) {
  return app.getProductGroupSalesReport(filter);
}

export async function getCustomerSalesReportAction(filter: DateRangeFilter) {
  return app.getCustomerSalesReport(filter);
}

export async function getSalespersonSalesReportAction(filter: DateRangeFilter) {
  return app.getSalespersonSalesReport(filter);
}

export async function getExecutiveDashboardReportAction(filter: DateRangeFilter) {
  return app.getExecutiveDashboardReport(filter);
}

// ==========================================
// Report Filters & Helpers
// ==========================================

export async function getReportFilterOptionsAction() {
  return app.getReportFilterOptions();
}

export async function getAllCustomersForReportAction() {
  return app.getAllCustomersForReport();
}

export async function getAllSalespersonsForReportAction() {
  return app.getAllSalespersonsForReport();
}

// ==========================================
// Sales Report Specific
// ==========================================

export async function getFilterOptionsAction() {
  return app.getFilterOptions();
}

export async function getReportSummaryAction(
  year: number,
  type: ReportType,
  entityId?: string,
) {
  return app.getReportSummary(year, type, entityId);
}

export async function getOrderHistoryAction(
  year: number,
  type: ReportType,
  entityId?: string,
  limit?: number,
) {
  return app.getOrderHistory(year, type, entityId, limit);
}

export async function getSalespersonDetailReportAction(employeeId: string) {
  return app.getSalespersonDetailReport(employeeId);
}
