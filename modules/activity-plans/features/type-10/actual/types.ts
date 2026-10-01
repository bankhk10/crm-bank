import type React from "react";
import type {
  ImageFile,
  ActualTargetsState,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import type { Type10SoldProductItem } from "../shared/types";

export type { Type10SoldProductItem };
export type SoldProductItem = Type10SoldProductItem;
export type Type10SoldProductDetail = Type10SoldProductItem;

export interface ActualType10FieldDayProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
    plot?: string;
    location?: string;
    showcase?: string;
    targetAttendees?: string;
    targetSales?: string;
  };
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
  products?: Array<{ id: string; name: string; productCode?: string | null; price?: number } | string>;
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

export interface DetailType10FieldDayProps {
  isVisible: boolean;
  target: {
    plot: string;
    location: string;
    showcase: string;
    targetAttendees: string;
    targetSales: string;
  };
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  targetFarmersList?: string;
  farmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
  images?: ImageFile[];
  productSalesDetails?: Type10SoldProductItem[];
  soldProducts?: Type10SoldProductItem[];
}

export interface ApprovalType10FieldDayProps {
  isVisible: boolean;
  target: ActualTargetsState["t10"];
}
