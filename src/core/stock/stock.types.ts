/**
 * Stock Types
 * Type definitions for stock domain
 */

/**
 * Result of stock allocation
 */
export interface StockAllocationResult {
  success: boolean;
  backorders: BackorderItem[];
}

/**
 * Backorder item details
 */
export interface BackorderItem {
  productId: string;
  productName?: string;
  requested: number;
  allocated: number;
  backorder: number;
}

/**
 * Stock lot information
 */
export interface StockLot {
  id: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  importDate: Date;
  expiryDate?: Date | null;
  storageLocation?: string | null;
  notes?: string | null;
  isUsed: boolean;
}

/**
 * Product stock summary
 */
export interface ProductStockSummary {
  productId: string;
  physicalBalance: number;
  reservedQuantity: number;
  availableQuantity: number;
}

/**
 * Stock adjustment input
 */
export interface StockAdjustmentInput {
  productId: string;
  lotId?: string;
  quantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
}

/**
 * Stock adjustment reasons
 */
export type StockAdjustmentReason =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "DAMAGE"
  | "EXPIRED"
  | "TRANSFER"
  | "CORRECTION";

/**
 * Stock warning for low stock products
 */
export interface StockWarning {
  productId: string;
  productName: string;
  currentStock: number;
  requestedQuantity: number;
  shortfall: number;
}

/**
 * LOT allocation for a sale item - used when confirming stock deduction
 */
export interface LotAllocation {
  saleItemId: string;
  lotId: string;
  quantity: number;
}

/**
 * Input for confirming stock deduction with LOT selection
 */
export interface ConfirmStockDeductionInput {
  saleId: string;
  lotAllocations: LotAllocation[];
}

/**
 * LOT info for display in UI
 */
export interface LotInfo {
  id: string;
  lotNumber: string;
  quantity: number; // available quantity in this lot
  expiryDate?: Date | null;
  storageLocation?: string | null;
  productId: string;
}

/**
 * Available LOTs for a sale item
 */
export interface SaleItemLotOptions {
  saleItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  requiredQuantity: number;
  availableLots: LotInfo[];
}
