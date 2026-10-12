/**
 * Type 5 (สำรวจตลาดของคู่แข่ง - Competitor Market Survey) - Domain Types
 * Single Source of Truth for Type 5 data structures.
 */

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

export interface Type5SurveyItem {
  id: string;
  storeId?: string;
  storeName: string;
  productId?: string;
  comparedProduct: string;
  detail: string;
}

export interface Type5ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  category?: string;
  surveyItemId?: string;
  [key: string]: any;
}

export interface TargetSurveyItem {
  id?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  productId?: string;
  product?: string;
  productName?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type5SurveyRecord {
  id?: string;
  storeId?: string;
  store: string;
  productId?: string;
  product: string;
  detail?: string;
  competitorBrand: string;
  competitorProduct: string;
  posPrice?: string | number | null;
  dealerPrice?: string | number | null;
  subdealerPrice?: string | number | null;
  farmerPrice?: string | number | null;
  sellingPoints?: string;
  bottleImages?: Type5ImageFile[];
  promotionalImages?: Type5ImageFile[];
  competitorPrice?: string;
  competitorUnit?: string;
  promotionDetail?: string;
  [key: string]: any;
}

/**
 * Type 5 Plan Target Representation (Multi-Target compliant)
 */
export interface Type5TargetItem {
  id?: string;
  storeId?: string;
  store: string;
  storeName?: string;
  productId?: string;
  product: string;
  productName?: string;
  detail?: string;
  notes?: string;
  items?: TargetSurveyItem[];
  [key: string]: any;
}
