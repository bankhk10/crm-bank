"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { applyDataScope } from "@/lib/data-scope";
import type { SaleFormData } from "@/modules/sales/types";
import type { SaleStatus, PaymentTerm } from "@/lib/db";
import {
  createSaleUseCase,
  updateSaleUseCase,
  getSaleDetailUseCase,
  listSalesUseCase,
} from "../application";
import { softDeleteSale } from "../infrastructure/sale.repository";
import {
  getSaleDetailForApproval,
  approveSaleUseCase,
  rejectSaleUseCase,
} from "../application/approve-sale";

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

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export async function createSaleAction(data: SaleFormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await createSaleUseCase(data, session.user.id);
    if (result.success) {
      revalidatePath("/sales");
    }
    return serializeData(result);
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function updateSaleAction(id: string, data: SaleFormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await updateSaleUseCase(id, data, session.user.id);
    if (result.success) {
      revalidatePath("/sales");
      revalidatePath(`/sales/${id}`);
      revalidatePath(`/sales/${id}/edit`);
    }
    return serializeData(result);
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function deleteSaleAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await softDeleteSale(id, session.user.id);
    if (!deleted) {
      return { success: false, error: "Sale not found" };
    }
    revalidatePath("/sales");
    return { success: true };
  } catch (_err) {
    return { success: false, error: "Failed to delete sale." };
  }
}

export async function getSaleAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const result = await getSaleDetailUseCase(id);
    return serializeData(result);
  } catch (_err) {
    return { success: false, error: "Failed to fetch" };
  }
}

export async function listSalesAction(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: SaleStatus;
  customerId?: string;
  employeeId?: string;
  paymentTerm?: PaymentTerm;
  dateFrom?: string;
  dateTo?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, sales: [], total: 0 };
  }

  try {
    // Build data-scope where clause
    const extraWhere: Record<string, unknown> = {};
    await applyDataScope(extraWhere, session, "sale");

    const result = await listSalesUseCase({ ...params, extraWhere });
    return serializeData({ success: true, ...result });
  } catch (_err) {
    return { success: false, sales: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// Approve / Reject
// ─────────────────────────────────────────────

export async function getSaleForApprovalAction(id: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: "Unauthorized" };

  try {
    const data = await getSaleDetailForApproval(id);
    if (!data) return { success: false as const, error: "Not found" };
    return { success: true as const, data: serializeData(data) };
  } catch (_err) {
    return { success: false as const, error: "Failed to fetch" };
  }
}

export async function approveSaleAction(id: string, notes?: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: "Unauthorized" };

  try {
    const result = await approveSaleUseCase(id, session.user.id, notes);
    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    return serializeData(result);
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to approve",
    };
  }
}

export async function rejectSaleAction(id: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: "Unauthorized" };

  try {
    const result = await rejectSaleUseCase(id, session.user.id, reason);
    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    return serializeData(result);
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message ?? "Failed to reject",
    };
  }
}
