/**
 * Shared Type Definitions for Type 4: วางบิล / เก็บเงิน
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

export interface Type4ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  workTypeCode?: string;
  storeId?: string;
  targetId?: string;
  previewUrl?: string;
  rawFile?: File;
  file?: File;
  [key: string]: any;
}

// Backward-compatible alias
export type ImageFile = Type4ImageFile;
