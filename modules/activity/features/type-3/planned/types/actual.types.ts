/**
 * Actual & Result Types for Type 3: เสนอขายสินค้า
 */

import type { Type3TargetItem } from "./planned.types";

export interface Type3ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  qty?: string | number;
  unitPrice?: string | number;
  price?: string | number;
  targetSales?: string | number;
  actualQty?: string | number;
  actualSales?: string | number;
  actualQuantity?: number;
  actualUnitPrice?: number;
  actualTotal?: number;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface Type3SaleResultItem {
  id?: string;
  productId: string;
  productName?: string | null;
  storeId?: string | null;
  actualQuantity: number;
  actualUnitPrice: number;
  actualTotal: number;
  unclosedReason?: string | null;
  isAdditional?: boolean;
}

export interface Type3ActualData {
  activityResultId?: string;
  workTypeCode?: string;
  productSalesDetails: Type3ProductSaleDetail[];
  saleResults?: Type3SaleResultItem[];
  soldProducts?: string;
  actualSales?: string | number;
  actualQuantity?: string | number;
  unclosedReason?: string;
}

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

export interface Type3ApprovalCardProps {
  isVisible: boolean;
  target?: Type3TargetItem;
  targets?: Type3TargetItem[];
}
