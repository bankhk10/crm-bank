"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getSalesForecastUseCase } from "../application";

export async function getSalesForecastAction(year: number, month: number | null = null) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return getSalesForecastUseCase(year, month);
}
