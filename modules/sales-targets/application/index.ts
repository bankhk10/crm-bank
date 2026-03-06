/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the sales-targets feature.
 */

import {
  findSalesTargetById,
  findSalesTargets,
  findPreviousMonthTarget,
  type FindSalesTargetsParams,
} from "../infrastructure/sales-target.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/**
 * Use case: Get a single sales target's detail by ID.
 */
export async function getSalesTargetDetailUseCase(id: string) {
  const salesTarget = await findSalesTargetById(id);
  if (!salesTarget) {
    return { success: false as const, error: "Not found" };
  }
  return { success: true as const, salesTarget };
}

/**
 * Use case: List sales targets with filters.
 */
export async function listSalesTargetsUseCase(params: FindSalesTargetsParams) {
  return findSalesTargets(params);
}

/**
 * Use case: Get previous month's target for copying.
 */
export async function getPreviousMonthTargetUseCase(params: {
  year: number;
  month: number;
  employeeId: string;
}) {
  const target = await findPreviousMonthTarget(params);
  if (!target) {
    return { success: false as const, error: "ไม่พบเป้าหมายเดือนก่อน" };
  }
  return {
    success: true as const,
    salesTarget: {
      ...target,
      stores: target.stores.map((store) => ({
        ...store,
        items: store.items.map((item) => ({
          ...item,
          pricePerBox: Number(item.pricePerBox),
          targetAmount: Number(item.targetAmount),
          product: item.product
            ? {
                ...item.product,
                cartonPrice:
                  item.product.cartonPrice != null
                    ? Number(item.product.cartonPrice)
                    : null,
              }
            : null,
        })),
      })),
    },
  };
}

// ─────────────────────────────────────────────
// Use Cases (separate files)
// ─────────────────────────────────────────────

export { createSalesTargetUseCase } from "./create-sales-target";
export { updateSalesTargetUseCase } from "./update-sales-target";

import { deleteSalesTargetById } from "../infrastructure/sales-target.repository";

/**
 * Use case: Delete a sales target by ID.
 */
export async function deleteSalesTargetUseCase(id: string) {
  return deleteSalesTargetById(id);
}

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  salesTargetSchema,
  salesTargetItemSchema,
  salesTargetStoreSchema,
  type SalesTargetFormValues,
  type SalesTargetStoreValues,
  type SalesTargetItemValues,
} from "./validations";
