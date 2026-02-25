/**
 * Stock Types
 */

export interface StockAllocationResult {
  success: boolean;
  backorders: BackorderItem[];
}

export interface BackorderItem {
  productId: string;
  productName?: string;
  requested: number;
  allocated: number;
  backorder: number;
}

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

export interface ProductStockSummary {
  productId: string;
  physicalBalance: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface StockAdjustmentInput {
  productId: string;
  lotId?: string;
  quantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
}

export type StockAdjustmentReason =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "DAMAGE"
  | "EXPIRED"
  | "TRANSFER"
  | "CORRECTION";

export interface StockWarning {
  productId: string;
  productName: string;
  currentStock: number;
  requestedQuantity: number;
  shortfall: number;
}

export interface LotAllocation {
  saleItemId: string;
  lotId: string;
  quantity: number;
}

export interface ConfirmStockDeductionInput {
  saleId: string;
  lotAllocations: LotAllocation[];
}

export interface LotInfo {
  id: string;
  lotNumber: string;
  quantity: number;
  expiryDate?: Date | null;
  storageLocation?: string | null;
  productId: string;
}

export interface SaleItemLotOptions {
  saleItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  requiredQuantity: number;
  availableLots: LotInfo[];
}
