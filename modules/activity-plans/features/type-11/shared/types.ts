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

export interface StockCheckItem {
  id?: string;
  storeId?: string | null;
  storeName: string;
  productId?: string;
  productName: string;
  productCode?: string;
  remainingQty: string;
  reorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  remarks: string;
  isCustom?: boolean;
}

export interface ProductOption {
  id?: string;
  value: string;
  label: string;
  subLabel?: string;
}
