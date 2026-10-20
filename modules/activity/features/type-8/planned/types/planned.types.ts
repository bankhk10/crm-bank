import type React from "react";
import type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8PromotionalProductLine,
  Type8CustomerOption,
  Type8ProductOption,
} from "../../shared/types";

export type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8PromotionalProductLine,
  Type8CustomerOption,
  Type8ProductOption,
};

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

export interface Type8PlannedFormProps {
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
  customers?: Type8CustomerOption[];
  products?: Type8ProductOption[];
  onDealerSelect?: (dealer: Type8CustomerOption | null) => void;
}

export type Type8PlanFormProps = Type8PlannedFormProps;
export type Type8MeetingProps = Type8PlannedFormProps;

export interface ValidateType8Options {
  items?: Type8MeetingItem[];
  selectedWorkTypes?: string[];
}

export interface Type8ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UseType8PlannedFormOptions {
  initial?: any;
  initDetails?: any;
  initialItems?: Type8MeetingItem[];
  initialTypes?: string[];
  customersList?: Type8CustomerOption[];
  productsList?: Type8ProductOption[];
  selectedWorkTypes?: string[];
  parentStartDate?: string;
}

export interface UseType8PlannedFormResult {
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
  mapType8Payload: (customersList?: any[], productsList?: any[]) => {
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
    stores?: Array<{
      workTypeCode?: string;
      storeId?: string | null;
      storeName?: string | null;
      subDealerStore?: string | null;
      visitPurpose?: string;
      remarks?: string | null;
      notes?: string | null;
      [key: string]: any;
    }>;
    planStores?: Array<{
      workTypeCode?: string;
      storeId?: string | null;
      storeName?: string | null;
      subDealerStore?: string | null;
      visitPurpose?: string;
      remarks?: string | null;
      notes?: string | null;
      [key: string]: any;
    }>;
  };
}
