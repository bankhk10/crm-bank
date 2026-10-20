/**
 * Unplanned Types for Type 4: วางบิล / เก็บเงิน 2-in-1 (Unplanned Billing & Collection)
 */

import type { StoreOption, Type4ImageFile } from "../../shared/types";
import type { CollectType, BillingStatus } from "../../shared/constants";

export interface Type4UnplannedItem {
  id: string;
  storeId?: string;
  customerName: string;
  collectType: CollectType;
  invoiceNo?: string;
  targetAmount?: number;
  receivedAmount?: number;
  billingStatus?: BillingStatus | "";
  billingDetail?: string;
  collectDetail?: string;
  notes?: string;
  images?: Type4ImageFile[];
}

export interface Type4UnplannedFormProps {
  items: Type4UnplannedItem[];
  addItem: () => void;
  removeItem: (id: string) => void;
  updateItem: (
    id: string,
    field: keyof Type4UnplannedItem,
    value: any,
  ) => void;
  customers?: StoreOption[];
  readonly?: boolean;
}

export interface Type4UnplannedPayload {
  targets: Array<{
    storeId?: string | null;
    collectType: "BILLING" | "COLLECT";
    targetAmount?: number | null;
    invoiceNo?: string | null;
    notes?: string | null;
  }>;
  planStores: Array<{
    workTypeCode: string;
    storeId?: string | null;
    storeName?: string | null;
    targetAmount?: number | null;
    remarks?: string | null;
    notes?: string | null;
  }>;
  result: {
    orderNo?: string | null;
    billingStatus?: string | null;
    receivedAmount?: number | null;
    billingDetail?: string | null;
    collectDetail?: string | null;
    notes?: string | null;
  };
  items: Array<{
    storeId?: string | null;
    companyName?: string | null;
    collectType: "BILLING" | "COLLECT";
    targetAmount?: number | null;
    receivedAmount?: number | null;
    billingStatus?: string | null;
    billingDetail?: string | null;
    collectDetail?: string | null;
    notes?: string | null;
  }>;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    workTypeCode: string;
    category: string;
    storeId?: string;
  }>;
}
