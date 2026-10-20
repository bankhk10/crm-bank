/**
 * Planned Types for Type 4: วางบิล / เก็บเงิน (Billing & Payment Collection)
 */

import type { StoreOption } from "../../shared/types";

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

export interface Type4PlanCardTargetItem {
  id?: string;
  customer?: string;
  companyName?: string;
  storeName?: string;
  storeId?: string;
  collectType?: "BILLING" | "COLLECT";
  targetCollect?: string;
  targetAmountNum?: number;
  collectAmount?: number;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type4PlanCardTarget {
  customer?: string;
  orderNo?: string;
  targetCollect?: string;
  targetAmountNum?: number;
  collectAmount?: number;
  actualCollectAmount?: number | null;
  collectType?: "BILLING" | "COLLECT";
  detail?: string;
  notes?: string;
  items?: Type4PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type4PlanCardProps {
  planType?: string;
  target?: Type4PlanCardTarget | null;
  className?: string;
}

export interface Type4PlanFormProps {
  readonly?: boolean;
  type4Items: Type4CollectItem[];
  addType4Row: () => void;
  updateType4Row: (
    id: string,
    field: keyof Type4CollectItem,
    val: any,
  ) => void;
  deleteType4Row: (id: string) => void;
  customers?: StoreOption[];
}

// Backward-compatible alias
export type Type4CollectProps = Type4PlanFormProps;

export interface ValidateType4Options {
  items?: Type4CollectItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type4ValidationResult {
  isValid: boolean;
  error?: string;
}
