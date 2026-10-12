import type React from "react";
import type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8MeetingItem,
  CustomerOption,
  ProductOption,
} from "../shared/types";
import type {
  ImageFile,
  ActualTargetsState,
} from "@/modules/activity-plans/features/shared/actual-view/types";

export type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8MeetingItem,
  CustomerOption,
  ProductOption,
};

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

export interface Type8PromotionalProductLine {
  id?: string;
  productId?: string;
  productName?: string;
  quantity?: number | string;
  quantityCases?: number | string;
  unitPrice?: number;
  pricePerCase?: number;
  totalAmount?: number;
  notes?: string;
  storeId?: string | null;
  [key: string]: any;
}

export interface Type8TargetItem {
  id?: string;
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
  promotionalProducts?: Type8PromotionalProductLine[];
  items?: any[];
  storeId?: string;
  venueType?: Type8VenueType;
  [key: string]: any;
}

export type Type8PlanItem = Type8TargetItem;

export interface Type8ActualRecord {
  t8ActualAttendees?: string | number;
  t8FeedbackQnA?: string;
  t8ProductSalesDetails?: ProductSaleDetail[];
  t8Images?: ImageFile[];
  t8RegistrationImages?: ImageFile[];
  [key: string]: any;
}

export interface ActualType8MeetingProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type8TargetItem;
  targets?: Type8TargetItem[];
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
  target: Type8TargetItem;
  targets?: Type8TargetItem[];
  actualAttendees?: string;
  feedbackQnA?: string;
  productSalesDetails?: ProductSaleDetail[];
  images?: ImageFile[];
  registrationImages?: ImageFile[];
}

export interface ApprovalType8MeetingProps {
  isVisible: boolean;
  target: Type8TargetItem;
  targets?: Type8TargetItem[];
}
