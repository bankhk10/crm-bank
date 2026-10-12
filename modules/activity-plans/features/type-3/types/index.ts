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

/**
 * Plan Card Types
 */
export interface Type3PlanCardTargetItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity?: number | string;
  targetQuantity?: number | string;
  targetQty?: number | string;
  qty?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  targetSales?: number | string;
  masterPrice?: number | null;
  customer?: string;
  storeId?: string;
  detail?: string;
  notes?: string;
  unit?: string | null;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  isAdditional?: boolean;
  [key: string]: any;
}

export interface Type3PlanCardTarget {
  product?: string;
  customer?: string;
  targetQty?: number | string;
  quantity?: number | string;
  unitPrice?: number | string;
  targetSales?: number | string;
  detail?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  items?: Type3PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type3PlanCardProps {
  planType?: string;
  target?: Type3PlanCardTarget | null;
  className?: string;
}

/**
 * Plan Form Props
 */
export interface Type3PlanFormProps {
  readonly?: boolean;
  type3Items: Type3SalesItem[];
  addType3Row: () => void;
  updateType3Row: (id: string, field: keyof Type3SalesItem, val: any) => void;
  deleteType3Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

// Backward-compatible alias
export type Type3SalesProps = Type3PlanFormProps;

/**
 * Actual Form Props
 */
export interface Type3ActualFormProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type3TargetItem;
  targets?: Type3TargetItem[];
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  soldProducts: string;
  setSoldProducts: (v: string) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualQuantity: string;
  setActualQuantity: (v: string) => void;
  unclosedReason: string;
  setUnclosedReason: (v: string) => void;
  productSalesDetails?: Type3ProductSaleDetail[];
  setProductSalesDetails?: (v: Type3ProductSaleDetail[]) => void;
}

// Backward-compatible alias
export type ActualType3SalesProps = Type3ActualFormProps;

/**
 * Detail View Props
 */
export interface Type3DetailViewProps {
  isVisible: boolean;
  target?: Type3TargetItem;
  targets?: Type3TargetItem[];
  soldProducts?: string;
  actualSales?: string;
  actualQuantity?: string;
  unclosedReason?: string;
  productSalesDetails?: Type3ProductSaleDetail[];
}

// Backward-compatible alias
export type DetailType3SalesProps = Type3DetailViewProps;

/**
 * Approval Card Props
 */
export interface Type3ApprovalCardProps {
  isVisible: boolean;
  target?: Type3TargetItem;
  targets?: Type3TargetItem[];
}

// Backward-compatible alias
export type ApprovalType3SalesProps = Type3ApprovalCardProps;

/**
 * Validation Options & Result
 */
export interface ValidateType3Options {
  items?: Type3SalesItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type3ValidationResult {
  isValid: boolean;
  error?: string;
}
