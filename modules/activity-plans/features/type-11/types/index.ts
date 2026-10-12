import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";

// ==========================================
// Domain & Target Types
// ==========================================

export interface Type11StoreItem {
  storeId: string;
  storeName: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export type EditCustomerOption = CustomerOption;

export interface ProductOption {
  id?: string;
  value: string;
  label: string;
  subLabel?: string;
}

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

export type Type11PlanTarget = Type11TargetItem;

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

export type StockCheckItem = Type11StockItem;

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
  t11StockStatus?: "ใกล้หมด" | "ขาดสต็อก" | "";
  t11ReorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  t11NextAction?: string;
  t11Images?: ImageFile[];
}

// ==========================================
// Component Props Types
// ==========================================

export interface Type11PlanCardProps {
  target?: Type11TargetItem;
  planType?: string;
  className?: string;
}

export interface Type11StockProps {
  readonly?: boolean;
  type11Stores: Type11StoreItem[] | string;
  setType11Stores: (val: Type11StoreItem[]) => void;
  customers?: CustomerOption[];
}

export type Type11PlanFormProps = Type11StockProps;

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

export type Type11ActualFormProps = ActualType11StockProps;

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

export type Type11DetailViewProps = DetailType11StockProps;

export interface ApprovalType11StockProps {
  isVisible: boolean;
  target?: Type11TargetItem;
  targets?: Type11TargetItem[];
}

export type Type11ApprovalCardProps = ApprovalType11StockProps;

// ==========================================
// Validation Types
// ==========================================

export interface ValidateType11Options {
  selectedWorkTypes?: string[];
  stores?: Type11StoreItem[] | string;
}

export interface Type11ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Type11StockItemInput {
  productId?: string;
  productName?: string;
  remainingQty?: string | number;
  reorderOpportunity?: string;
  remarks?: string;
  stockStatus?: string;
}
