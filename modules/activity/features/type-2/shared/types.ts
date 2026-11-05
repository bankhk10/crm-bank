export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
}

export interface Type2ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
  file?: File;
  previewUrl?: string;
  workTypeCode?: string;
  storeId?: string;
  targetId?: string;
  description?: string;
  isUploaded?: boolean;
  [key: string]: any;
}

export type ImageFile = Type2ImageFile;
