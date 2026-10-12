/**
 * Type 3 (เสนอขายสินค้า / Product Sales Proposal) - Domain Types
 * Single Source of Truth for Type 3 data structures.
 */

export interface Type3SalesProductLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  notes?: string;
  unitPrice?: number;
  price?: number;
  masterPrice?: number | null;
  isPriceOverridden?: boolean;
}

export interface Type3SalesItem {
  id: string;
  storeId?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  customerName: string;
  products?: Type3SalesProductLine[];
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  masterPrice?: number | null;
  notes?: string;
  detail?: string;
}

export interface TargetProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  qty?: string;
  unitPrice?: string;
  detail?: string;
  notes?: string;
  unit?: string;
  price?: string;
  targetSales?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface Type3ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  qty?: string;
  unitPrice?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  responsibleEmployeeId?: string | null;
  parentDealerId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

/**
 * Type 3 Plan Target Representation (Single Target or Item in Multi-Target List)
 */
export interface Type3TargetItem {
  id?: string;
  product?: string;
  customer: string;
  storeId?: string;
  storeName?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  targetQty?: string;
  unitPrice?: string;
  targetSales?: string;
  detail?: string;
  items?: TargetProductItem[];
  [key: string]: any;
}
