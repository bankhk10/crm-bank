"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateFulfillmentUseCase, getLotOptionsUseCase } from "../application";
import { findSales } from "@/modules/sales/infrastructure/sale.repository";

export async function updateFulfillmentAction(id: string, payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const sale = await updateFulfillmentUseCase(id, session.user.id, payload);

    revalidatePath(`/sales/${id}`);
    revalidatePath("/fulfillment");

    return { success: true, sale };
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

    // Fix warning about passing Decimal object to Client components
    // Decimal fields need serialization
    const serializedSales = result.sales.map((sale) => ({
      ...sale,
      totalAmount: sale.totalAmount.toNumber(),
      subtotalAmount: sale.subtotalAmount.toNumber(),
      shippingCost: sale.shippingCost.toNumber(),
      otherCosts: sale.otherCosts.toNumber(),
      promotionalCreditUsed: sale.promotionalCreditUsed?.toNumber() || null,
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        originalPrice: item.originalPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
        product: {
          ...item.product,
          price: item.product.price ? item.product.price.toNumber() : null,
        },
      })),
    }));

    return {
      success: true,
      sales: serializedSales,
      total: result.total,
    };
  } catch (error) {
    console.error("Error fetching fulfillments", error);
    throw new Error("Failed to fetch fulfillments");
  }
}
