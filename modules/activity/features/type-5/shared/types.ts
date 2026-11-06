export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
  shopName?: string | null;
  storeName?: string | null;
  [key: string]: any;
}

export type StoreOption = CustomerOption;

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
  [key: string]: any;
}

export interface Type5ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  category?: string;
  surveyItemId?: string;
  rawFile?: File;
  [key: string]: any;
}

export type ImageFile = Type5ImageFile;
