/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the shipping-companies feature.
 * Small use cases are defined inline; larger ones are in separate files.
 */

import {
  findShippingCompanyById,
  findShippingCompanies,
  type ListShippingCompaniesParams,
} from "../infrastructure/shipping-company.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/**
 * Use case: Get a single shipping company's detail by ID.
 */
export async function getShippingCompanyDetailUseCase(id: string) {
  const shippingCompany = await findShippingCompanyById(id);
  if (!shippingCompany) {
    return { success: false as const, error: "Not found" };
  }
  return { success: true as const, shippingCompany };
}

/**
 * Use case: List shipping companies with pagination & filtering.
 */
export async function listShippingCompaniesUseCase(
  params: ListShippingCompaniesParams,
) {
  return findShippingCompanies(params);
}

// ─────────────────────────────────────────────
// Use Cases (separate files – have meaningful logic)
// ─────────────────────────────────────────────

export { createShippingCompanyUseCase } from "./create-shipping-company";
export { updateShippingCompanyUseCase } from "./update-shipping-company";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  shippingCompanySchema,
  shippingCompanyUpdateSchema,
  type ShippingCompanyFormValues,
  type ShippingCompanyUpdateFormValues,
} from "./validations";
