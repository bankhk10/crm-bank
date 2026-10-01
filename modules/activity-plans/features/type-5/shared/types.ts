export interface Type5SurveyItem {
  id: string;
  storeId?: string;
  storeName: string;
  productId?: string;
  comparedProduct: string;
  detail: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}
