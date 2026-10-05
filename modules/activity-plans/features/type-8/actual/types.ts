import type React from "react";
import type {
  ImageFile,
  ActualTargetsState,
} from "@/modules/activity-plans/features/shared/actual-view/types";

export interface ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  actualQty: string;
  actualSales?: string;
  unitPrice?: number;
  notes?: string;
  isAdditional?: boolean;
}

export interface ActualType8MeetingProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
    topic?: string;
    products?: string;
    targetAttendees?: string;
    customer?: string;
    dealerName?: string;
    subDealerStore?: string;
    detail?: string;
    targetProducts?: string[];
    targetProductItems?: Array<{
      id?: string;
      productId?: string;
      productName: string;
      [key: string]: any;
    }>;
    promotionalProducts?: Array<{
      id?: string;
      productId?: string;
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      totalAmount?: number;
      notes?: string;
      storeId?: string | null;
      [key: string]: any;
    }>;
    items?: { productName: string; targetQty?: string }[];
  };
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    price?: number | null;
    unit?: string | null;
    [key: string]: any;
  }>;
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  feedbackQnA: string;
  setFeedbackQnA: (v: string) => void;
  productSalesDetails?: ProductSaleDetail[];
  setProductSalesDetails?: (v: ProductSaleDetail[]) => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  registrationImages?: ImageFile[];
  setRegistrationImages?: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export interface DetailType8MeetingProps {
  isVisible: boolean;
  target: {
    topic: string;
    products: string;
    targetAttendees: string;
    customer?: string;
    dealerName?: string;
    subDealerStore?: string;
    detail?: string;
    targetProducts?: string[];
    targetProductItems?: Array<{
      id?: string;
      productId?: string;
      productName: string;
      [key: string]: any;
    }>;
    promotionalProducts?: Array<{
      id?: string;
      productId?: string;
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      totalAmount?: number;
      notes?: string;
    }>;
    items?: { productName: string; targetQty?: string }[];
  };
  actualAttendees?: string;
  feedbackQnA?: string;
  productSalesDetails?: ProductSaleDetail[];
  images?: ImageFile[];
  registrationImages?: ImageFile[];
}

export interface ApprovalType8MeetingProps {
  isVisible: boolean;
  target: ActualTargetsState["t8"];
}
