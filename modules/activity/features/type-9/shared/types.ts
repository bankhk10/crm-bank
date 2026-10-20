import type { Type1ImageFile } from "@/modules/activity/features/type-1";

export type Type9ImageFile = Type1ImageFile;

export interface Type9ProductItem {
  id: string;
  productId?: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface Type9CustomerOption {
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
  parentDealerId?: string | null;
  parentDealer?: {
    id: string;
    customerCode?: string | null;
    name: string;
  } | null;
  responsibleEmployeeId?: string | null;
  [key: string]: any;
}

export interface Type9ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface Type9TargetProductItem {
  id?: string;
  productId?: string;
  storeId?: string | null;
  productName: string;
  quantityCases?: number;
  pricePerCase?: number;
  totalAmount?: number;
  actualQuantityCases?: number | string;
  actualSales?: number | string;
}

export interface Type9ProductSaleDetail {
  id?: string;
  productId?: string;
  storeId?: string | null;
  productName: string;
  pricePerCase?: number;
  quantityCases?: number;
  totalAmount?: number;
  actualQuantityCases?: string | number;
  actualSales?: string | number;
}
