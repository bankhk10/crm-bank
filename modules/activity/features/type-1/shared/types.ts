/**
 * Shared Type Definitions for Type 1 (เข้าพบร้านค้า / Key Farmer)
 */

export interface Type1ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
}

export type ImageFile = Type1ImageFile;

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
  addressLine?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface Type1AdviceProductItem {
  id?: string;
  productId: string;
  productName: string;
  productCode?: string | null;
  targetId?: string;
}
