import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface Type11TargetStoreItem {
  storeId?: string;
  store?: string;
  storeName?: string;
  detail?: string;
}

export interface Type11TargetItem {
  id?: string;
  store: string;
  detail: string;
  targetOpportunity?: string;
  items?: Type11TargetStoreItem[];
  [key: string]: any;
}

export interface Type11StockItem {
  id?: string;
  storeId?: string | null;
  storeName: string;
  productId?: string;
  productName: string;
  productCode?: string;
  remainingQty: string;
  remainingQuantity?: number;
  remainingStockQty?: number;
  stockStatus?: "ใกล้หมด" | "ขาดสต็อก" | "ปกติ" | string;
  reorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  remarks: string;
  isCustom?: boolean;
}

export interface Type11PlanItem {
  storeId: string;
  storeName?: string | null;
  notes?: string | null;
}

export interface Type11ActualRecord {
  t11StockItems: Type11StockItem[];
  t11ProductList?: string;
  t11RemainingQty?: string;
  t11Remarks?: string;
  t11StockStatus?: "ใกล้หมด" | "ขาดสต็อก" | "ปกติ" | string;
  t11ReorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  t11NextAction?: string;
  t11Images?: ImageFile[];
}

export interface ActualType11StockProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type11TargetItem;
  targets?: Type11TargetItem[];
  products?: Array<{ id: string; name: string; productCode?: string | null } | string>;
  productList?: string;
  setProductList?: (v: string) => void;
  remainingQty?: string;
  setRemainingQty?: (v: string) => void;
  remarks?: string;
  setRemarks?: (v: string) => void;
  stockItems?: Type11StockItem[];
  setStockItems?: (items: Type11StockItem[]) => void;
  nextAction?: string;
  setNextAction?: (v: string) => void;
  images?: ImageFile[];
  setImages?: (v: ImageFile[]) => void;
}

export interface DetailType11StockProps {
  isVisible: boolean;
  target?: Type11TargetItem;
  targets?: Type11TargetItem[];
  productList?: string;
  remainingQty?: string;
  remarks?: string;
  stockItems?: Type11StockItem[];
  stockStatus?: "ใกล้หมด" | "ขาดสต็อก" | "ปกติ" | string;
  reorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  nextAction?: string;
  images?: ImageFile[];
}

export interface ApprovalType11StockProps {
  isVisible: boolean;
  target?: Type11TargetItem;
  targets?: Type11TargetItem[];
}
