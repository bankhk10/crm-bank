/**
 * Type 4 (วางบิล / เก็บเงิน - Billing & Payment Collection) - Domain Types
 * Single Source of Truth for Type 4 data structures.
 */

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface Type4CollectItem {
  id: string;
  collectType?: "BILLING" | "COLLECT";
  storeId?: string;
  customerName: string;
  collectAmount: number;
  detail: string;
  invoiceNo?: string;
}

export interface TargetCollectCompanyItem {
  id?: string;
  customer?: string;
  companyName: string;
  targetCollect?: string;
  targetAmountNum?: number;
  collectType?: "BILLING" | "COLLECT";
  receivedAmount?: string;
  billingStatus?: "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ" | "";
  billingDetail?: string;
  collectDetail?: string;
  detail?: string;
  storeId?: string;
}

export interface Type4ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  workTypeCode?: string;
  storeId?: string;
  targetId?: string;
}

/**
 * Type 4 Plan Target Representation (Multi-Target compliant)
 */
export interface Type4TargetItem {
  id?: string;
  customer: string;
  companyName?: string;
  storeId?: string;
  storeName?: string;
  collectType?: "BILLING" | "COLLECT";
  targetCollect?: string;
  targetAmountNum?: number;
  collectAmount?: number;
  receivedAmount?: string;
  orderNo?: string;
  billingStatus?: "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ" | string;
  billingDetail?: string;
  collectDetail?: string;
  detail?: string;
  notes?: string;
  items?: TargetCollectCompanyItem[];
  [key: string]: any;
}
