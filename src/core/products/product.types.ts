/**
 * Product Types
 * Type definitions for product domain
 */

import type { ProductStatus } from "@/src/infrastructure/database";

/**
 * Product summary for lists
 */
export interface ProductSummary {
  id: string;
  productCode: string;
  name: string;
  commonName?: string;
  unit?: string;
  price?: number;
  status: ProductStatus;
  stockQuantity?: number;
}

/**
 * Product detail with all relations
 */
export interface ProductDetail extends ProductSummary {
  productGroup?: string;
  brand?: string;
  packageSize?: string;
  packageSizePerBox?: string;
  usedForPlants?: string[];
  salesPoint?: string;
  properties?: string;
  promotionBudget?: number;
  images?: ProductImage[];
  promotionItems?: ProductPromotionItem[];
  freeItems?: ProductFreeItem[];
  stockLots?: ProductStockLot[];
}

/**
 * Product image
 */
export interface ProductImage {
  id: string;
  url: string;
  filename: string;
  order: number;
}

/**
 * Product promotion item
 */
export interface ProductPromotionItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  notes?: string;
}

/**
 * Product free item (buy X get Y)
 */
export interface ProductFreeItem {
  id: string;
  purchaseQty: number;
  freeQty: number;
  netPrice?: number;
  notes?: string;
}

/**
 * Product stock lot
 */
export interface ProductStockLot {
  id: string;
  lotNumber: string;
  quantity: number;
  importDate: Date;
  expiryDate?: Date;
  storageLocation?: string;
  notes?: string;
  isUsed: boolean;
}

/**
 * Product filter parameters
 */
export interface ProductFilterParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: ProductStatus;
  productGroup?: string;
  brand?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Create product input
 */
export interface CreateProductInput {
  productCode: string;
  name: string;
  commonName?: string;
  unit?: string;
  productGroup?: string;
  brand?: string;
  packageSize?: string;
  packageSizePerBox?: string;
  status?: ProductStatus;
  usedForPlants?: string[];
  salesPoint?: string;
  properties?: string;
  price?: number;
  promotionBudget?: number;
}
