export interface Type3SalesProductLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  notes?: string;
  unitPrice?: number;
  price?: number;
  masterPrice?: number | null;
  isPriceOverridden?: boolean;
}

export interface Type3SalesItem {
  id: string;
  storeId?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  customerName: string;
  products?: Type3SalesProductLine[];
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  notes?: string;
  detail?: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  responsibleEmployeeId?: string | null;
  parentDealerId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}
