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
  findTradeNameGroups,
  findBrands,
  findProductGroups,
  findPlants,
  findProductCategories,
  findProductABCTypes,
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
 * Returns units, groups, brands, product groups, plants, categories, abcTypes.
 */
export async function getProductFormOptionsUseCase() {
  const [units, groups, brands, chemicalGroups, plants, categories, abcTypes] =
    await Promise.all([
      findUnits(),
      findTradeNameGroups(),
      findBrands(),
      findProductGroups(),
      findPlants(),
      findProductCategories(),
      findProductABCTypes(),
    ]);

  return {
    units: units.map((u) => ({
      value: u.description,
      label: `${u.code} - ${u.description}`,
    })),
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
    abcTypes: abcTypes.map((c) => ({
      value: c.id,
      label: c.description ? `${c.code} - ${c.name} - ${c.description}` : `${c.code} - ${c.name}`,
    })),
  };
}

// ─────────────────────────────────────────────
// Use Cases (separate files – have meaningful logic)
// ─────────────────────────────────────────────

export { createProductUseCase } from "./create-product";
export { updateProductUseCase } from "./update-product";
export { manageProductUseCase } from "./manage-product";

// Stock Management
export {
  allocateStockUseCase,
  releaseStockUseCase,
  confirmStockDeductionUseCase,
  revertStockDeductionUseCase,
  confirmStockDeductionWithLotsUseCase,
  revertStockDeductionFromLotsUseCase,
} from "./stock-management";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  productSchema,
  productUpdateSchema,
  productManagementSchema,
  type ProductFormValues,
  type ProductUpdateFormValues,
  type ProductManagementFormValues,
} from "./validations";
