/**
 * Shared Type Definitions for Type 3: เสนอขายสินค้า
 */

export interface StoreOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
  parentDealerId?: string | null;
}

export type CustomerOption = StoreOption;

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
  packageSizeUnit?: string | null;
}

export interface Type3ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  previewUrl?: string;
  rawFile?: File;
  file?: File;
  [key: string]: any;
}
