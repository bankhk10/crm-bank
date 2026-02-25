/**
 * Fulfillment Feature Types
 */

import type { DateRange } from "react-day-picker";
import type { SaleWithRelations, SaleStatus } from "@/modules/sales/types";

export type { SaleStatus };
export type SaleRecord = SaleWithRelations;

export interface FulfillmentTableProps {
  sales: SaleRecord[];
  total: number;
  page: number;
  perPage: number;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  currentUserId?: string;
  // Permissions (Added for consistency, check if used)
  canView?: boolean;
  canEdit?: boolean;
}

export interface LotInfo {
  id: string;
  lotNumber: string;
  quantity: number;
  expiryDate?: Date | string | null;
  storageLocation?: string | null;
  productId: string;
}

export interface ExistingAllocation {
  lotId: string;
  lotNumber: string;
  quantity: number;
}

export interface SuggestedAllocation {
  lotId: string;
  lotNumber: string;
  quantity: number;
}

export interface SaleItemLotOption {
  saleItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  requiredQuantity: number;
  availableLots: LotInfo[];
  existingAllocations?: ExistingAllocation[];
  suggestedAllocations?: SuggestedAllocation[];
}

export interface LotAllocation {
  saleItemId: string;
  lotId: string;
  quantity: number;
}

export interface LotSelectorProps {
  saleId: string;
  onAllocationsChange: (allocations: LotAllocation[], isValid: boolean) => void;
  disabled?: boolean;
}
