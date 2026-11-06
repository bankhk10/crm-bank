import type React from "react";
import type {
  Type9ImageFile,
  Type9ProductSaleDetail,
  Type9CustomerOption,
  Type9ProductOption,
} from "../../shared/types";
import type { Type9TargetItem } from "./planned.types";

export interface Type9ActualRecord {
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: Type9ImageFile[];
}

export interface Type9ActualFormProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type9TargetItem;
  targets?: Type9TargetItem[];
  customers?: Type9CustomerOption[];
  products?: Type9ProductOption[];
  formats?: string[];
  setFormats?: (v: string[]) => void;
  actualSales?: string;
  setActualSales?: (v: string) => void;
  productSalesDetails?: Type9ProductSaleDetail[];
  setProductSalesDetails?: (v: Type9ProductSaleDetail[]) => void;
  actualAttendees?: string;
  setActualAttendees?: (v: string) => void;
  images?: Type9ImageFile[];
  setImages?: (v: Type9ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export type ActualType9StoreProps = Type9ActualFormProps;

export interface Type9DetailViewProps {
  isVisible?: boolean;
  target?: Type9TargetItem;
  targets?: Type9TargetItem[];
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: Type9ImageFile[];
}

export type DetailType9StoreProps = Type9DetailViewProps;

export interface Type9ApprovalCardProps {
  isVisible?: boolean;
  target?: Type9TargetItem;
  targets?: Type9TargetItem[];
}

export type ApprovalType9StoreProps = Type9ApprovalCardProps;

export interface Type9ActualValidationInput {
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: Type9ImageFile[];
}
