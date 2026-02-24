"use server";

import { getDashboardDataUseCase } from "../application";
import { type DashboardData } from "../types";

export async function getDashboardDataAction(): Promise<DashboardData> {
  // Can add auth check here if needed eventually
  // For now dashboard was open to whoever could reach the page
  return getDashboardDataUseCase();
}
