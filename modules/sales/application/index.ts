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

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  saleFormSchema,
  saleItemSchema,
  type SaleFormValues,
} from "./validations";

// ─────────────────────────────────────────────
// Re-export address utils (business logic)
// ─────────────────────────────────────────────

export {
  parseAddress,
  buildFullAddress,
  buildCustomerShippingAddress,
  buildCompanyAddress,
  cleanAddressPrefix,
} from "./address-utils";
