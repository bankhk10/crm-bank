export interface Type9ProductItem {
  id: string;
  productId?: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
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
  parentDealerId?: string | null;
  parentDealer?: {
    id: string;
    customerCode?: string | null;
    name: string;
  } | null;
  responsibleEmployeeId?: string | null;
  [key: string]: any;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}
