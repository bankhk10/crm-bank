/**
 * Planned Types for Type 3: เสนอขายสินค้า (Product Sales Proposal)
 */

import type { StoreOption, ProductOption } from "../../shared/types";

export interface Type3SalesProductLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  masterPrice?: number | null;
  isPriceOverridden?: boolean;
  notes?: string;
}

export interface Type3SalesItem {
  id: string;
  storeId?: string;
  isSubDealer?: boolean;
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
  subDealerStore?: string;
  dealerName?: string;
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
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
  subDealerStore?: string;
  dealerName?: string;
  qty?: string | number;
  unitPrice?: string | number;
  detail?: string;
  notes?: string;
  unit?: string;
  price?: string | number;
  targetSales?: string | number;
  actualQty?: string | number;
  actualSales?: string | number;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface Type3TargetItem {
  id?: string;
  product?: string;
  customer: string;
  storeId?: string;
  storeName?: string;
  isSubDealer?: boolean;
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
  subDealerStore?: string;
  dealerName?: string;
  targetQty?: string | number;
  unitPrice?: string | number;
  targetSales?: string | number;
  detail?: string;
  items?: TargetProductItem[];
  [key: string]: any;
}

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
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
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
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
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

export interface Type3PlannedFormProps {
  readonly?: boolean;
  type3Items: Type3SalesItem[];
  addType3Row: () => void;
  updateType3Row: (id: string, field: keyof Type3SalesItem, val: any) => void;
  deleteType3Row: (id: string) => void;
  addProductToRow?: (rowId: string) => void;
  updateProductInRow?: (
    rowId: string,
    prodId: string,
    field: keyof Type3SalesProductLine,
    val: any,
    productItem?: any,
  ) => void;
  deleteProductFromRow?: (rowId: string, prodId: string) => void;
  customers?: StoreOption[];
  products?: ProductOption[];
}

export type Type3PlanFormProps = Type3PlannedFormProps;

export interface ValidateType3Options {
  items?: Type3SalesItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type3ValidationResult {
  isValid: boolean;
  error?: string;
}
