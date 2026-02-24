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
 *   useProductColumns,
 *   type Product
 * } from "@/modules/products";
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// UI Components
export { ProductStatusBadge, statusStyle } from "./ui/product-status-badge";

// Features - List View
export { ProductsTable } from "./features/list-view/products-table";
export { ProductsCards } from "./features/list-view/products-cards";
export { useProductColumns } from "./features/list-view/use-product-columns";

// Features - Form
export { ProductForm } from "./features/form/product-form";
