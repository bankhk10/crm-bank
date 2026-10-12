import type {
  TargetProductItem,
  Type3ProductSaleDetail,
  Type3TargetItem,
} from "../types";

export type { TargetProductItem, Type3ProductSaleDetail, Type3TargetItem };

export interface ActualType3SalesProps {
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

export interface DetailType3SalesProps {
  isVisible: boolean;
  target?: Type3TargetItem;
  targets?: Type3TargetItem[];
  soldProducts?: string;
  actualSales?: string;
  actualQuantity?: string;
  unclosedReason?: string;
  productSalesDetails?: Type3ProductSaleDetail[];
}

export interface ApprovalType3SalesProps {
  isVisible: boolean;
  target?: Type3TargetItem;
  targets?: Type3TargetItem[];
}
