"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { applyDataScope } from "@/lib/data-scope";
import type { SaleFormData } from "@/modules/sales/types";
import type { SaleStatus, PaymentTerm } from "@/lib/db";
import { auditLogger } from "@/lib/logger/audit-logger";
import { createActionLogger } from "@/lib/logger/middleware";
import {
  createSaleUseCase,
  updateSaleUseCase,
  getSaleDetailUseCase,
  listSalesUseCase,
  deleteSaleUseCase,
} from "../application";
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
  const { context } = createActionLogger("createSale", session as any);

  try {
    const result = await createSaleUseCase(data, session.user.id);
    if (result.success && result.sale) {
      await auditLogger.logCreate(
        "Sale",
        result.sale.id,
        JSON.parse(JSON.stringify(result.sale)),
        context,
        { module: "sales", entityName: result.sale.saleNumber }
      );
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
  const { context } = createActionLogger("updateSale", session as any);

  try {
    const result = await updateSaleUseCase(id, data, session.user.id);
    if (result.success && result.sale && result.existingSale) {
      await auditLogger.logUpdate(
        "Sale",
        result.sale.id,
        JSON.parse(JSON.stringify(result.existingSale)),
        JSON.parse(JSON.stringify(result.sale)),
        context,
        { module: "sales", entityName: result.sale.saleNumber }
      );
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
  const { context } = createActionLogger("deleteSale", session as any);

  try {
    const deleted = await deleteSaleUseCase(id, session.user.id);
    if (!deleted) {
      return { success: false, error: "Sale not found" };
    }
    await auditLogger.logDelete(
      "Sale",
      deleted.id,
      JSON.parse(JSON.stringify(deleted)),
      context,
      { module: "sales", entityName: deleted.saleNumber }
    );
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
  customerId?: string | string[];
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
  const { context } = createActionLogger("approveSale", session as any);

  try {
    const result = await approveSaleUseCase(id, session.user.id, notes);
    if (result.success && result.sale && result.existingSale) {
      await auditLogger.logApprove(
        "Sale",
        result.sale.id,
        JSON.parse(JSON.stringify(result.existingSale)),
        JSON.parse(JSON.stringify(result.sale)),
        context,
        { module: "sales", entityName: result.sale.saleNumber }
      );
    }
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
  const { context } = createActionLogger("rejectSale", session as any);

  try {
    const result = await rejectSaleUseCase(id, session.user.id, reason);
    if (result.success && result.sale && result.existingSale) {
      await auditLogger.logReject(
        "Sale",
        result.sale.id,
        JSON.parse(JSON.stringify(result.existingSale)),
        JSON.parse(JSON.stringify(result.sale)),
        context,
        { module: "sales", entityName: result.sale.saleNumber, errorMessage: reason }
      );
    }
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
