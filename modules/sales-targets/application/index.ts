/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the sales-targets feature.
 * Small use cases are defined inline; larger ones are in separate files.
 */

import {
  findSalesTargetById,
  findSalesTargets,
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

// ─────────────────────────────────────────────
// Use Cases (separate files – have meaningful logic)
// ─────────────────────────────────────────────

export { createSalesTargetUseCase } from "./create-sales-target";
export { updateSalesTargetUseCase } from "./update-sales-target";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  salesTargetSchema,
  salesTargetItemSchema,
  type SalesTargetFormValues,
} from "./validations";
