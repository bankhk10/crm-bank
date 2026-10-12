import type React from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";

export interface Type10SoldProductItem {
  id?: string;
  isCustomProduct?: boolean;
  isCustom?: boolean;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  quantity?: string | number;
  actualQty?: string | number;
  actualSales?: string | number;
  unitPrice?: number;
  remarks?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export type SoldProductItem = Type10SoldProductItem;
export type Type10SoldProductDetail = Type10SoldProductItem;

export interface Type10TargetItem {
  plot?: string;
  location?: string;
  showcase?: string;
  targetAttendees?: string;
  targetSales?: string;
  crop?: string;
  demoPlotId?: string | null;
  [key: string]: any;
}

export interface Type10PlanItem {
  demoPlotId?: string | null;
  location?: string;
  targetAttendeesCount?: number;
  targetBookingSales?: number;
  products?: Array<{
    productId: string;
    productName?: string | null;
  }>;
}

export interface Type10ActualRecord {
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  farmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
  targetFarmersList?: string;
  productSalesDetails?: Type10SoldProductItem[];
  soldProducts?: Type10SoldProductItem[];
  images?: ImageFile[];
}

// Plan Card Types
export interface Type10PlanTarget {
  plot?: string;
  location?: string;
  showcase?: string;
  targetAttendees?: number | string;
  targetSales?: number | string;
  [key: string]: any;
}

export interface Type10PlanCardProps {
  target?: Type10PlanTarget;
  planType?: string;
  className?: string;
}

// Plan Form Types
export interface Type10FieldDayProps {
  readonly?: boolean;
  isEdit?: boolean;
  type10DemoPlot: string;
  setType10DemoPlot: (val: string) => void;
  type10Location?: string;
  setType10Location?: (val: string) => void;
  type10TargetCrop?: string;
  setType10TargetCrop?: (val: string) => void;
  type10Showcase?: string;
  setType10Showcase?: (val: string) => void;
  type10Attendees: number;
  setType10Attendees: (val: number) => void;
  type10BookingSales: number;
  setType10BookingSales: (val: number) => void;
  demoPlots?: UserDemoPlotOption[];
}

export type Type10PlanFormProps = Type10FieldDayProps;

// Actual Form Types
export interface ActualType10FieldDayProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type10TargetItem;
  targets?: Type10TargetItem[];
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  actualSalesOrBooking: string;
  setActualSalesOrBooking: (v: string) => void;
  farmerFeedback: "สูง" | "กลาง" | "ต่ำ" | "";
  setFarmerFeedback: (v: "สูง" | "กลาง" | "ต่ำ" | "") => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;

  // Fields for "เลือกสินค้าที่ขายได้"
  hasSales?: boolean;
  setHasSales?: (v: boolean) => void;
  products?: Array<
    | {
        id: string;
        name: string;
        productCode?: string | null;
        price?: number;
      }
    | string
  >;
  soldProducts?: Type10SoldProductItem[];
  setSoldProducts?: (items: Type10SoldProductItem[]) => void;
  soldProduct?: string;
  setSoldProduct?: (v: string) => void;
  soldQuantity?: string;
  setSoldQuantity?: (v: string) => void;
  soldDetails?: string;
  setSoldDetails?: (v: string) => void;

  // Optional backward compatibility
  targetFarmersList?: string;
  setTargetFarmersList?: (v: string) => void;
}

export type Type10ActualFormProps = ActualType10FieldDayProps;

// Detail View Props
export interface DetailType10FieldDayProps {
  isVisible: boolean;
  target: Type10TargetItem;
  targets?: Type10TargetItem[];
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  targetFarmersList?: string;
  farmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
  images?: ImageFile[];
  productSalesDetails?: Type10SoldProductItem[];
  soldProducts?: Type10SoldProductItem[];
}

export type Type10DetailViewProps = DetailType10FieldDayProps;

// Approval Card Props
export interface ApprovalType10FieldDayProps {
  isVisible: boolean;
  target: Type10TargetItem;
  targets?: Type10TargetItem[];
}

export type Type10ApprovalCardProps = ApprovalType10FieldDayProps;

// Validation Types
export interface ValidateType10Options {
  selectedWorkTypes?: string[];
  type10DemoPlot?: string;
  type10Attendees?: number;
}

export interface Type10ValidationResult {
  isValid: boolean;
  error?: string;
}

// Hook Types
export interface UseType10FormOptions {
  initial?: any;
  initDetails?: any;
  demoPlotsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType10FormResult {
  type10DemoPlot: string;
  setType10DemoPlot: React.Dispatch<React.SetStateAction<string>>;
  type10Location: string;
  setType10Location: React.Dispatch<React.SetStateAction<string>>;
  type10TargetCrop: string;
  setType10TargetCrop: React.Dispatch<React.SetStateAction<string>>;
  type10Showcase: string;
  setType10Showcase: React.Dispatch<React.SetStateAction<string>>;
  type10Attendees: number;
  setType10Attendees: React.Dispatch<React.SetStateAction<number>>;
  type10BookingSales: number;
  setType10BookingSales: React.Dispatch<React.SetStateAction<number>>;
  validateType10: () => Type10ValidationResult;
  mapType10Payload: (demoPlots: any[]) => {
    submittedDemoPlotId: string | null;
    targetAttendees: number | null;
    targetBookingSales: number | null;
  };
}
