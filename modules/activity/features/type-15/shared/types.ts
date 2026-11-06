/**
 * Type 15 Feature: บูมทีม / คาราวาน (Boom Team / Caravan)
 * Shared Domain Types & Interfaces
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
  [key: string]: any;
}

export type CustomerOption = StoreOption;

export interface Type15ImageFile {
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

export interface Type15BoomItem {
  id: string;
  storeId?: string;
  dealerName?: string;
  customerName?: string;
  isSubDealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
  isUnregisteredSubdealer?: boolean;
  subDealerStore?: string;
  village?: string;
  objective?: string;
  detail?: string;
  [key: string]: any;
}

export interface Type15TargetItem {
  id: string;
  storeId?: string | null;
  storeName?: string | null;
  customerName?: string | null;
  dealerName?: string | null;
  name?: string | null;
  customer?: string | null;
  subdealerId?: string | null;
  subdealerName?: string | null;
  isSubDealer?: boolean;
  isUnregisteredSubdealer?: boolean;
  subDealerStore?: string | null;
  village?: string | null;
  objective?: string | null;
  detail?: string | null;
  store?: StoreOption | null;
  subdealer?: StoreOption | null;
  results?: any[];
  items?: Type15BoomItem[];
  [key: string]: any;
}

