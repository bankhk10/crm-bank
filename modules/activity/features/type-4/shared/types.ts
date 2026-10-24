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

export interface Type4TargetEntity {
  id: string;
  activityPlanId: string;
  collectType: "BILLING" | "COLLECT" | string;
  storeId?: string | null;
  targetAmount?: number | string | any | null;
  invoiceNo?: string | null;
  notes?: string | null;
  store?: any | null;
  result?: Type4ResultEntity | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type4ResultEntity {
  id: string;
  activityPlanId: string;
  targetId?: string | null;
  storeId?: string | null;
  companyName?: string | null;
  collectType: "BILLING" | "COLLECT" | string;
  targetAmount?: number | string | any | null;
  receivedAmount?: number | string | any | null;
  orderNo?: string | null;
  billingStatus?: string | null;
  billingDetail?: string | null;
  collectDetail?: string | null;
  notes?: string | null;
  store?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
