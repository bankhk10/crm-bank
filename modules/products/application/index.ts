/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the products feature.
 * Small use cases are defined inline; larger ones are in separate files.
 */

import {
  findProductById,
  findProducts,
  findUnits,
  findProductGroups,
  findBrands,
  findChemicalGroups,
  findPlants,
  findProductCategories,
  findProductChains,
  type ListProductsParams,
} from "../infrastructure/product.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/**
 * Use case: Get a single product's detail by ID.
 */
export async function getProductDetailUseCase(id: string) {
  const product = await findProductById(id);
  if (!product) {
    return { success: false as const, error: "Not found" };
  }
  return { success: true as const, product };
}

/**
 * Use case: List products with pagination & filtering.
 */
export async function listProductsUseCase(params: ListProductsParams) {
  return findProducts(params);
}

/**
 * Use case: Fetch all form options for product creation/editing.
 * Returns units, groups, brands, chemical groups, plants, categories, chains.
 */
export async function getProductFormOptionsUseCase() {
  const [units, groups, brands, chemicalGroups, plants, categories, chains] =
    await Promise.all([
      findUnits(),
      findProductGroups(),
      findBrands(),
      findChemicalGroups(),
      findPlants(),
      findProductCategories(),
      findProductChains(),
    ]);

  return {
    units: units.map((u) => ({ value: u.description, label: u.description })),
    groups: groups.map((g) => ({ value: g.code, label: g.description })),
    brands: brands.map((b) => ({
      value: b.description,
      label: b.description,
    })),
    chemicalGroups: chemicalGroups.map((g) => ({
      value: g.code,
      label: g.code + " - " + g.name,
    })),
    plants: plants.map((p) => ({ value: p.name, label: p.name })),
    categories: categories.map((c) => ({
      value: c.id,
      label: c.code + " - " + c.description,
    })),
    chains: chains.map((c) => ({ value: c.id, label: c.name })),
  };
}

// ─────────────────────────────────────────────
// Use Cases (separate files – have meaningful logic)
// ─────────────────────────────────────────────

export { createProductUseCase } from "./create-product";
export { updateProductUseCase } from "./update-product";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  productSchema,
  productUpdateSchema,
  type ProductFormValues,
  type ProductUpdateFormValues,
} from "./validations";
