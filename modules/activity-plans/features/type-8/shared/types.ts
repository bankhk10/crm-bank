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
