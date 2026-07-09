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
  onClear?: () => void;
  currentUserId?: string;
  statusFilter?: string[];
  onStatusFilterChange?: (value: string[]) => void;
  // Permissions (Added for consistency, check if used)
  canView?: boolean;
  canEdit?: boolean;
  onExportPending?: () => void;
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

// ──────────────────────────────────────────
// Split Shipment Types
// ──────────────────────────────────────────

export type ShipmentStatusType = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "COMPLETED" | "CANCELLED";

export interface ShipmentItemRecord {
  id: string;
  shipmentId: string;
  saleItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleItem: {
    id: string;
    productId: string;
    productCode: string;
    name: string;
    unit: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    packageSizePerBox?: number | string | null;
    promotionBudget?: number | null;
  };
}

export interface ShipmentRecord {
  id: string;
  saleId: string;
  shipmentNumber: number;
  status: ShipmentStatusType;
  scheduledDate: string | Date | null;
  actualDate: string | Date | null;
  paymentDate: string | Date | null;
  dueDate: string | Date | null;
  salesOrderNumber: string | null;
  shippingCompanyId: string | null;
  shippingCompanyName: string | null;
  deliveryMethod: string | null;
  pickupCompanyId: string | null;
  pickupCompanyName: string | null;
  shippingAddress: string | null;
  customerShippingAddress: string | null;
  notes: string | null;
  totalAmount: number;
  shippingDiscount: number;
  billDiscount: number;
  createdById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: ShipmentItemRecord[];
  shippingCompany?: { id: string; name: string; phone?: string | null } | null;
  createdBy?: { id: string; name: string } | null;
}

export interface ShipmentItemInput {
  saleItemId: string;
  quantity: number;
}

export interface CreateShipmentInput {
  items: ShipmentItemInput[];
  scheduledDate?: string | null;
  paymentDate?: string | null;
  dueDate?: string | null;
  salesOrderNumber?: string | null;
  shippingCompanyId?: string | null;
  shippingCompanyName?: string | null;
  deliveryMethod?: string | null;
  pickupCompanyId?: string | null;
  pickupCompanyName?: string | null;
  shippingAddress?: string | null;
  customerShippingAddress?: string | null;
  notes?: string | null;
  shippingDiscount?: number | null;
  billDiscount?: number | null;
}

export interface UpdateShipmentInput {
  status?: ShipmentStatusType;
  scheduledDate?: string | null;
  actualDate?: string | null;
  paymentDate?: string | null;
  dueDate?: string | null;
  salesOrderNumber?: string | null;
  shippingCompanyId?: string | null;
  shippingCompanyName?: string | null;
  deliveryMethod?: string | null;
  pickupCompanyId?: string | null;
  pickupCompanyName?: string | null;
  shippingAddress?: string | null;
  customerShippingAddress?: string | null;
  notes?: string | null;
  shippingDiscount?: number | null;
  billDiscount?: number | null;
}

export interface RemainingByItem {
  saleItemId: string;
  productCode: string;
  productName: string;
  unit: string;
  totalQuantity: number;
  allocatedQuantity: number;
  remainingQuantity: number;
}

