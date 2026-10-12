import type React from "react";
import type {
  ImageFile,
} from "@/modules/activity-plans/features/shared/actual-view/types";

export type Type8MeetingTarget = "FARMER" | "DEALER" | "SUBDEALER";
export type Type8FarmerChannel = "DEALER" | "SUBDEALER";
export type Type8VenueType = "STORE" | "OTHER";

export interface Type8PromotionProductItem {
  id: string;
  productId?: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
  notes?: string;
}

export interface Type8MeetingItem {
  id: string;
  meetingTarget?: Type8MeetingTarget;
  farmerChannel?: Type8FarmerChannel;
  dealerId?: string;
  dealerName?: string;
  subdealerId?: string;
  subDealerStore?: string;
  isUnregisteredSubdealer?: boolean;
  topic: string;
  targetProductIds?: string[];
  targetProducts?: string[];
  attendeesCount: number;
  detail: string;
  promotionProducts?: Type8PromotionProductItem[];
  venueType?: Type8VenueType;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  phone?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  [key: string]: any;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export type EditProductOption = ProductOption;

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

// Plan Card Types
export interface Type8PlanTarget {
  topic?: string;
  products?: string;
  targetAttendees?: number | string;
  customer?: string;
  dealerName?: string;
  subDealerStore?: string;
  detail?: string;
  targetProducts?: string[];
  promotionalProducts?: Array<{
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
  }>;
  items?: any[];
  [key: string]: any;
}

export interface Type8PlanCardProps {
  target?: Type8PlanTarget;
  planType?: string;
  className?: string;
  hidePromotionsTable?: boolean;
}

// Plan Form Types
export interface Type8MeetingProps {
  readonly?: boolean;
  type8Items: Type8MeetingItem[];
  addType8Row?: () => void;
  updateType8Row: (id: string, field: keyof Type8MeetingItem, val: any) => void;
  deleteType8Row?: (id: string) => void;
  addPromotionProduct?: (meetingId: string) => void;
  updatePromotionProduct?: (
    meetingId: string,
    promoId: string,
    field: keyof Type8PromotionProductItem,
    val: any,
  ) => void;
  deletePromotionProduct?: (meetingId: string, promoId: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
  onDealerSelect?: (dealer: CustomerOption | null) => void;
}

export type Type8PlanFormProps = Type8MeetingProps;

// Actual Form Types
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

export type Type8ActualFormProps = ActualType8MeetingProps;

// Detail View Props
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

export type Type8DetailViewProps = DetailType8MeetingProps;

// Approval Card Props
export interface ApprovalType8MeetingProps {
  isVisible: boolean;
  target: Type8TargetItem;
  targets?: Type8TargetItem[];
}

export type Type8ApprovalCardProps = ApprovalType8MeetingProps;

// Validation Types
export interface ValidateType8Options {
  items?: Type8MeetingItem[];
  selectedWorkTypes?: string[];
}

export interface Type8ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Type8ActualValidationInput {
  activityResultStatus?: string;
  t8RegistrationImages?: ImageFile[];
}

// Notes Types
export interface DecodedType8Notes {
  detail: string;
  promotions: string[];
}

// Hook Types
export interface UseType8FormOptions {
  initial?: any;
  initDetails?: any;
  initialTypes?: string[];
  customersList?: CustomerOption[];
  productsList?: ProductOption[];
  selectedWorkTypes?: string[];
  parentStartDate?: string;
}

export interface UseType8FormResult {
  type8Items: Type8MeetingItem[];
  setType8Items: React.Dispatch<React.SetStateAction<Type8MeetingItem[]>>;
  addType8Row: () => void;
  updateType8Row: (id: string, field: keyof Type8MeetingItem, val: any) => void;
  deleteType8Row: (id: string) => void;
  addPromotionProduct: (meetingId: string) => void;
  updatePromotionProduct: (
    meetingId: string,
    promoId: string,
    field: keyof Type8PromotionProductItem,
    val: any,
  ) => void;
  deletePromotionProduct: (meetingId: string, promoId: string) => void;
  validateType8: () => Type8ValidationResult;
  mapType8Payload: (products: any[]) => {
    type8Data?: {
      meetings?: Array<{
        meetingTarget?: Type8MeetingTarget;
        farmerChannel?: Type8FarmerChannel;
        dealerId?: string | null;
        dealerName?: string | null;
        subdealerId?: string | null;
        subDealerStore?: string | null;
        isUnregisteredSubdealer?: boolean;
        topic: string;
        targetProducts?: string[];
        attendeesCount: number;
        detail: string;
        venueType?: Type8VenueType;
        promotions?: Type8PromotionProductItem[];
      }>;
    };
  };
}
