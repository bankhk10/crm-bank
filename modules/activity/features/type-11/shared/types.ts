import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type { StockStatus, ReorderOpportunity } from "./constants";

export type { ImageFile as Type11ImageFile, StockStatus, ReorderOpportunity };

export interface Type11StoreItem {
  storeId: string;
  storeName: string;
  remarks?: string;
  notes?: string;
}

export interface Type11CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
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
  storeId?: string | null;
  storeName: string;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  remainingQty: string | number;
  remainingQuantity?: number;
  remainingStockQty?: number;
  stockStatus?: StockStatus | string;
  reorderOpportunity?: ReorderOpportunity | string;
  remarks?: string;
  isCustom?: boolean;
}
