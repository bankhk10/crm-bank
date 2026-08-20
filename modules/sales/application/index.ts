/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the sales feature.
 * Small use cases are defined inline; larger ones are in separate files.
 */

import {
  findSaleById,
  findSales,
  type ListSalesParams,
} from "../infrastructure/sale.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/**
 * Use case: Get a single sale's detail by ID.
 */
export async function getSaleDetailUseCase(id: string) {
  const sale = await findSaleById(id);
  if (!sale) {
    return { success: false as const, error: "Not found" };
  }
  return { success: true as const, sale };
}

/**
 * Use case: List sales with pagination & filtering.
 */
export async function listSalesUseCase(params: ListSalesParams) {
  return findSales(params);
}

// ─────────────────────────────────────────────
// Use Cases (separate files – have meaningful logic)
// ─────────────────────────────────────────────

export { createSaleUseCase } from "./create-sale";
export { updateSaleUseCase } from "./update-sale";
export { deleteSaleUseCase } from "./delete-sale";
export {
  getSaleDetailForApproval,
  approveSaleUseCase,
  rejectSaleUseCase,
} from "./approve-sale";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  saleFormSchema,
  saleItemSchema,
  type SaleFormValues,
} from "./validations";

// ─────────────────────────────────────────────
// Order Management & Utils
// ─────────────────────────────────────────────

export {
  checkExpiredOrdersUseCase,
  checkOverdueOrdersUseCase,
  updateDeliveryDateUseCase,
  getOrderExpiryInfoUseCase,
} from "./order-management";

export {
  generateSaleNumber,
  calculateTotals,
  calculateOrderExpiryDate,
} from "./utils";

export { applyDataAccessFilters } from "./authorization";
export { buildSaleDetailExportWorkbook } from "./export-sale-detail";
