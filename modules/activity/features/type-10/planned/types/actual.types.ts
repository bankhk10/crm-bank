import type React from "react";
import type {
  Type10ImageFile,
  Type10SoldProductItem,
  Type10ProductOption,
  FarmerFeedback,
} from "../../shared/types";
import type { Type10TargetItem, Type10PlanTarget } from "./planned.types";

export interface Type10ActualRecord {
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  farmerFeedback?: FarmerFeedback | "";
  targetFarmersList?: string;
  productSalesDetails?: Type10SoldProductItem[];
  soldProducts?: Type10SoldProductItem[];
  images?: Type10ImageFile[];
}

export interface Type10ActualFormProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type10TargetItem;
  targets?: Type10TargetItem[];
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  actualSalesOrBooking: string;
  setActualSalesOrBooking: (v: string) => void;
  salesResultAmount?: string;
  setSalesResultAmount?: (v: string) => void;
  farmerFeedback: FarmerFeedback | "";
  setFarmerFeedback: (v: FarmerFeedback | "") => void;
  images: Type10ImageFile[];
  setImages: (v: Type10ImageFile[]) => void;

  hasSales?: boolean;
  setHasSales?: (v: boolean) => void;
  products?: Array<Type10ProductOption | { id: string; name: string }>;
  soldProducts?: Type10SoldProductItem[];
  setSoldProducts?: (items: Type10SoldProductItem[]) => void;
  soldProduct?: string;
  setSoldProduct?: (v: string) => void;
  soldQuantity?: string;
  setSoldQuantity?: (v: string) => void;
  soldDetails?: string;
  setSoldDetails?: (v: string) => void;
  targetFarmersList?: string;
  setTargetFarmersList?: (v: string) => void;
}

export type ActualType10FieldDayProps = Type10ActualFormProps;

export interface Type10DetailViewProps {
  isVisible?: boolean;
  target?: Type10TargetItem;
  targets?: Type10TargetItem[];
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  salesResultAmount?: string;
  targetFarmersList?: string;
  farmerFeedback?: FarmerFeedback | "";
  images?: Type10ImageFile[];
  productSalesDetails?: Type10SoldProductItem[];
  soldProducts?: Type10SoldProductItem[];
  notes?: string;
}

export type DetailType10FieldDayProps = Type10DetailViewProps;

export interface Type10ApprovalCardProps {
  isVisible?: boolean;
  target?: Type10TargetItem | Type10PlanTarget;
  targets?: Array<Type10TargetItem | Type10PlanTarget>;
  plan?: any;
}

export type ApprovalType10FieldDayProps = Type10ApprovalCardProps;

export interface Type10ActualValidationInput {
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  farmerFeedback?: string;
  hasSales?: boolean;
  soldProducts?: Type10SoldProductItem[];
}
