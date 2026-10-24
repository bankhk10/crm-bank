import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type { StockStatus, ReorderOpportunity } from "./constants";

export type { ImageFile as Type11ImageFile, StockStatus, ReorderOpportunity };

export type Type11ProductRole = "TARGET" | "ADDITIONAL_AUDIT";

export interface Type11StoreItem {
  id?: string;
  targetId?: string;
  storeId?: string | null;
  storeName: string;
  isUnregisteredStore?: boolean;
  storeCode?: string | null;
  province?: string | null;
  district?: string | null;
  dealerId?: string | null;
  dealerName?: string | null;
  visitPurpose?: string | null;
  remarks?: string;
  notes?: string;
  products?: Type11ProductEntity[];
  result?: Type11ResultEntity | null;
  [key: string]: any;
}

export interface Type11CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface Type11ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface Type11StockItem {
  id?: string;
  targetId?: string;
  storeId?: string | null;
  storeName: string;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  productRole?: Type11ProductRole | string;
  // Quantity fields
  targetQuantity?: number | string | null;
  targetNotes?: string | null;
  remainingQty: string | number;
  remainingQuantity?: number;
  actualQuantity?: number;
  remainingStockQty?: number;
  // Status & Actions
  stockStatus?: StockStatus | string;
  reorderOpportunity?: ReorderOpportunity | string;
  suggestedOrderQty?: number | string | null;
  remarks?: string;
  nextAction?: string | null;
  isCustom?: boolean;
}

export interface Type11TargetEntity {
  id: string;
  activityPlanId: string;
  storeId?: string | null;
  storeName?: string | null;
  isUnregisteredStore: boolean;
  storeCode?: string | null;
  province?: string | null;
  district?: string | null;
  dealerId?: string | null;
  dealerName?: string | null;
  visitPurpose?: string | null;
  notes?: string | null;
  products?: Type11ProductEntity[];
  result?: Type11ResultEntity | null;
  store?: any | null;
  dealer?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type11ProductEntity {
  id: string;
  activityPlanId: string;
  targetId: string;
  productId?: string | null;
  productName?: string | null;
  productRole: Type11ProductRole | string;
  targetQuantity?: number | string | null;
  targetNotes?: string | null;
  actualQuantity?: number | string | null;
  stockStatus?: string | null;
  reorderOpportunity?: string | null;
  suggestedOrderQty?: number | string | null;
  remarks?: string | null;
  nextAction?: string | null;
  product?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type11ResultEntity {
  id: string;
  activityPlanId: string;
  targetId: string;
  overallStockStatus?: string | null;
  overallReorderOpportunity?: string | null;
  feedback?: string | null;
  nextAction?: string | null;
  summary?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
