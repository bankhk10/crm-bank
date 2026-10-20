/**
 * Actual & Result Types for Type 4: วางบิล / เก็บเงิน (Billing & Payment Collection)
 */

import type { TargetCollectCompanyItem, Type4TargetItem } from "./planned.types";
export type { TargetCollectCompanyItem, Type4TargetItem };
import type { Type4ImageFile } from "../../shared/types";

export interface Type4ActualData {
  activityResultId?: string;
  workTypeCode?: string;
  orderNo?: string;
  receivedAmount?: string;
  billingStatus?: string;
  billingDetail?: string;
  collectDetail?: string;
  notes?: string;
  items?: TargetCollectCompanyItem[];
  paymentImages?: Type4ImageFile[];
}

export interface Type4ActualFormProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type4TargetItem;
  targets?: Type4TargetItem[];
  orderNo: string;
  setOrderNo: (v: string) => void;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  billingStatus?: string;
  setBillingStatus?: (v: string) => void;
  billingDetail?: string;
  setBillingDetail?: (v: string) => void;
  collectDetail?: string;
  setCollectDetail?: (v: string) => void;
  paymentImages?: Type4ImageFile[];
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement> | File[]) => void;
  onRemoveImage?: (id: string) => void;
}

// Backward-compatible alias
export type ActualType4CollectProps = Type4ActualFormProps;

export interface Type4DetailViewProps {
  isVisible: boolean;
  target?: Type4TargetItem;
  targets?: Type4TargetItem[];
  orderNo?: string;
  receivedAmount?: string;
  billingStatus?: string;
  billingDetail?: string;
  collectDetail?: string;
  paymentImages?: Type4ImageFile[];
}

// Backward-compatible alias
export type DetailType4CollectProps = Type4DetailViewProps;

export interface Type4ApprovalCardProps {
  isVisible: boolean;
  target?: Type4TargetItem;
  targets?: Type4TargetItem[];
  actualCollectAmount?: number | string | null;
}

// Backward-compatible alias
export type ApprovalType4CollectProps = Type4ApprovalCardProps;
