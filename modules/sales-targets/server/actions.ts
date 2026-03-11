"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  getSalesTargetDetailUseCase,
  listSalesTargetsUseCase,
  createSalesTargetUseCase,
  updateSalesTargetUseCase,
  getPreviousMonthTargetUseCase,
  getAvailableYearsUseCase,
} from "../application";
import { deleteSalesTargetById } from "../infrastructure/sales-target.repository";
import { findSalesTargetHistory } from "../infrastructure/sales-target-history.repository";

// ─────────────────────────────────────────────
// Query Actions
// ─────────────────────────────────────────────

export async function getSalesTargetsAction(params: {
  year: number;
  month?: number;
  employeeId?: string;
  shopId?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized",
      detailedTargets: [],
    };
  }

  try {
    const data = await listSalesTargetsUseCase(params);
    return { success: true, ...data };
  } catch (_err) {
    return {
      success: false,
      error: "Failed to fetch",
      detailedTargets: [],
    };
  }
}

export async function getAvailableYearsAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized", years: [] };
  }

  try {
    return await getAvailableYearsUseCase();
  } catch (_err) {
    return { success: false, error: "Failed to fetch years", years: [] };
  }
}

export async function getSalesTargetAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    return await getSalesTargetDetailUseCase(id);
  } catch (_err) {
    return { success: false, error: "Failed to fetch" };
  }
}

/**
 * Get previous month's sales target for a given employee.
 */
export async function getPreviousMonthTargetAction(params: {
  year: number;
  month: number;
  employeeId: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    return await getPreviousMonthTargetUseCase(params);
  } catch (_err) {
    return { success: false, error: "Failed to fetch previous month target" };
  }
}

// ─────────────────────────────────────────────
// Mutation Actions
// ─────────────────────────────────────────────

export async function createSalesTargetAction(rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const isAdmin = session.user.roles?.includes("administrator");
  const hasPermission = session.user.permissionKeys?.includes(
    "sales_target.create",
  );

  if (!isAdmin && !hasPermission) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const result = await createSalesTargetUseCase(rawData, session.user.id);
    if (result.success) {
      revalidatePath("/sales-targets");
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function updateSalesTargetAction(id: string, rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const isAdmin = session.user.roles?.includes("administrator");
  const hasPermission =
    session.user.permissionKeys?.includes("sales_target.edit") ||
    session.user.permissionKeys?.includes("sales_target.create");

  if (!isAdmin && !hasPermission) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const result = await updateSalesTargetUseCase(id, rawData, session.user.id);
    if (result.success) {
      revalidatePath("/sales-targets");
      revalidatePath(`/sales-targets/${id}/edit`);
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function deleteSalesTargetAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const isAdmin = session.user.roles?.includes("administrator");
  const hasPermission = session.user.permissionKeys?.includes(
    "sales_target.delete",
  );

  if (!isAdmin && !hasPermission) {
    return { success: false, error: "Forbidden" };
  }

  try {
    await deleteSalesTargetById(id);
    revalidatePath("/sales-targets");
    return { success: true };
  } catch (_err) {
    return { success: false, error: "Failed to delete sales target." };
  }
}

// ─────────────────────────────────────────────
// History Actions
// ─────────────────────────────────────────────

/**
 * Get the change history for a specific sales target.
 * Only the creator (sales_employee) or admins/managers with permission can view.
 */
export async function getSalesTargetHistoryAction(salesTargetId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized", history: [] };
  }

  const hasPermission =
    session.user.roles?.includes("administrator") ||
    session.user.permissionKeys?.includes("sales_target.view") ||
    session.user.permissionKeys?.includes("menu.sales_targets");

  if (!hasPermission) {
    return { success: false as const, error: "Forbidden", history: [] };
  }

  try {
    const history = await findSalesTargetHistory(salesTargetId);
    return { success: true as const, history };
  } catch (_err) {
    return {
      success: false as const,
      error: "Failed to fetch history",
      history: [],
    };
  }
}
