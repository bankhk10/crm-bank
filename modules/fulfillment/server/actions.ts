"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { revalidatePath } from "next/cache";
import { updateFulfillmentUseCase, getLotOptionsUseCase } from "../application";
import { findSales } from "@/modules/sales/infrastructure/sale.repository";

// Helper to convert Prisma.Decimal objects to numbers, as they are not supported by Server Actions
function serializeData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (
    typeof obj.toNumber === "function" &&
    typeof obj.toFixed === "function" &&
    "d" in obj
  ) {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeData);
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = serializeData(value);
  }
  return result;
}

export async function updateFulfillmentAction(id: string, payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const sale = await updateFulfillmentUseCase(id, session.user.id, payload);

    revalidatePath(`/sales/${id}`);
    revalidatePath("/fulfillment");

    return { success: true, saleId: sale.id };
  } catch (error) {
    console.error("updateFulfillment object:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update fulfillment",
    };
  }
}

export async function getLotOptionsAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await getLotOptionsUseCase(id);
    if (!data) {
      return { success: false, error: "Sale not found" };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching lot options:", error);
    return { success: false, error: "Failed to fetch lot options" };
  }
}

export async function getFulfillmentsAction(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await findSales({
      page: params.page,
      perPage: params.perPage,
      search: params.search,
      status: params.status as any,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });

    return {
      success: true,
      sales: serializeData(result.sales),
      total: result.total,
    };
  } catch (error) {
    console.error("Error fetching fulfillments", error);
    throw new Error("Failed to fetch fulfillments");
  }
}
