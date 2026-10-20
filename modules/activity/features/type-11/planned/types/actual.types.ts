import type React from "react";
import type {
  Type11StockItem,
  Type11ImageFile,
  Type11ProductOption,
  StockStatus,
  ReorderOpportunity,
} from "../../shared/types";
import type { Type11TargetItem, Type11PlanTarget } from "./planned.types";

export interface Type11ActualRecord {
  t11StockItems: Type11StockItem[];
  t11ProductList?: string;
  t11RemainingQty?: string;
  t11Remarks?: string;
  t11StockStatus?: StockStatus | "";
  t11ReorderOpportunity?: ReorderOpportunity | "";
  t11NextAction?: string;
  t11Images?: Type11ImageFile[];
}

export interface Type11ActualFormProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type11TargetItem;
  targets?: Type11TargetItem[];
  products?: Array<Type11ProductOption | { id: string; name: string; productCode?: string | null }>;
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
  images?: Type11ImageFile[];
  setImages?: (v: Type11ImageFile[]) => void;
}

export type ActualType11StockProps = Type11ActualFormProps;

export interface Type11DetailViewProps {
  isVisible: boolean;
  target?: Type11TargetItem;
  targets?: Type11TargetItem[];
  productList?: string;
  remainingQty?: string;
  remarks?: string;
  stockItems?: Type11StockItem[];
  stockStatus?: StockStatus | string;
  reorderOpportunity?: ReorderOpportunity | string;
  nextAction?: string;
  images?: Type11ImageFile[];
}

export type DetailType11StockProps = Type11DetailViewProps;

export interface Type11ApprovalCardProps {
  isVisible: boolean;
  target?: Type11TargetItem | Type11PlanTarget;
  targets?: Array<Type11TargetItem | Type11PlanTarget>;
}

export type ApprovalType11StockProps = Type11ApprovalCardProps;

export interface Type11ActualValidationInput {
  stockItems?: Type11StockItem[];
}
