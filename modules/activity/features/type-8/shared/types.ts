import type { Type1ImageFile } from "@/modules/activity/features/type-1";

export type Type8ImageFile = Type1ImageFile;

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

export interface Type8CustomerOption {
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

export interface Type8ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export type Type8ProductRole = "TARGET" | "PROMOTION" | "ADDITIONAL_SALE";

export interface Type8DbTarget {
  id: string;
  activityPlanId: string;
  meetingTarget: Type8MeetingTarget | string;
  farmerChannel?: Type8FarmerChannel | string | null;
  dealerId?: string | null;
  dealerName?: string | null;
  subdealerId?: string | null;
  subDealerStore?: string | null;
  isUnregisteredSubdealer: boolean;
  topic: string;
  venueType: Type8VenueType | string;
  location?: string | null;
  meetingDate?: Date | string | null;
  meetingTime?: string | null;
  targetAttendeesCount: number;
  detail?: string | null;
  dealer?: any;
  subdealer?: any;
  products?: Type8DbProduct[];
  result?: Type8DbResult | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Type8DbProduct {
  id: string;
  activityPlanId: string;
  targetId: string;
  productId?: string | null;
  productName?: string | null;
  productRole: Type8ProductRole | string;
  targetQuantity?: any;
  targetUnitPrice?: any;
  targetAmount?: any;
  promotionNotes?: string | null;
  actualQuantity?: any;
  actualUnitPrice?: any;
  actualTotal?: any;
  actualNotes?: string | null;
  product?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Type8DbResult {
  id: string;
  activityPlanId: string;
  targetId: string;
  actualAttendeesCount: number;
  feedbackQnA?: string | null;
  summary?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
