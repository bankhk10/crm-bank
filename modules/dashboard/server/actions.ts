"use server";

import { getDashboardDataUseCase } from "../application";
import { getSalesDashboardDataUseCase } from "../application";
import { type DashboardData, type SalesDashboardData } from "../types";

export async function getDashboardDataAction(): Promise<DashboardData> {
  // Can add auth check here if needed eventually
  // For now dashboard was open to whoever could reach the page
  return getDashboardDataUseCase();
}

export async function getSalesDashboardDataAction(
  employeeId: string,
): Promise<SalesDashboardData> {
  return getSalesDashboardDataUseCase(employeeId);
}
