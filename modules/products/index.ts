/**
 * Products Feature Module
 *
 * This is the main barrel export file for the products feature.
 * Import everything from this file when working with products.
 *
 * @example
 * import {
 *   ProductsTable,
 *   ProductForm,
 *   listProductsAction,
 *   type Product
 * } from "@/modules/products";
 */

// Types
export * from "./types";
export * from "./types/stock";

// Constants
export * from "./constants";

// Application – ONLY types & validations (no server-side deps)
export {
  productSchema,
  productUpdateSchema,
  productManagementSchema,
  type ProductFormValues,
  type ProductUpdateFormValues,
  type ProductManagementFormValues,
} from "./application/validations";

// Server Actions (safe for client import – marked "use server")
export {
  listProductsAction,
  getProductAction,
  createProductAction,
  updateProductAction,
  manageProductAction,
  deleteProductAction,
  getProductFormOptionsAction,
} from "./server/actions";

// UI Components
export { ProductStatusBadge, statusStyle } from "./ui/product-status-badge";

// Features - List View
export { ProductsTable } from "./features/list-view/products-table";
export { useProductColumns } from "./features/list-view/use-product-columns";
export { default as ProductsListView } from "./features/list-view/products-list-view";

// Features - Detail View
export { default as ProductDetailView } from "./features/detail-view/product-detail-view";

// Features - Form
export { ProductForm } from "./features/form/product-form";
export { ProductManageForm } from "./features/form/product-manage-form";
export { default as ProductNewView } from "./features/form/product-new-view";
export { default as ProductEditView } from "./features/form/product-edit-view";

// Features - Check Product
export { CheckProductView } from "./features/check-product-view";

// Features - Settings View
export { default as BrandSettingsView } from "./features/settings-view/brand-settings-view";
export { default as CategorySettingsView } from "./features/settings-view/category-settings-view";
export { default as ABCTypeSettingsView } from "./features/settings-view/abc-type-settings-view";
export { default as ProductGroupSettingsView } from "./features/settings-view/product-group-settings-view";
export { default as TradeNameGroupSettingsView } from "./features/settings-view/trade-name-group-settings-view";
export { default as PlantSettingsView } from "./features/settings-view/plant-settings-view";
export { default as UnitSettingsView } from "./features/settings-view/unit-settings-view";
