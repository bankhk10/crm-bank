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
