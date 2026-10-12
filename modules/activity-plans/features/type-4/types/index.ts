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

// Backward-compatible alias
export type ImageFile = Type4ImageFile;

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

/**
 * Plan Card Types
 */
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

/**
 * Plan Form Props
 */
export interface Type4PlanFormProps {
  readonly?: boolean;
  type4Items: Type4CollectItem[];
  addType4Row: () => void;
  updateType4Row: (id: string, field: keyof Type4CollectItem, val: any) => void;
  deleteType4Row: (id: string) => void;
  customers?: CustomerOption[];
}

// Backward-compatible alias
export type Type4CollectProps = Type4PlanFormProps;

/**
 * Actual Form Props
 */
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
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

// Backward-compatible alias
export type ActualType4CollectProps = Type4ActualFormProps;

/**
 * Detail View Props
 */
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

/**
 * Approval Card Props
 */
export interface Type4ApprovalCardProps {
  isVisible: boolean;
  target?: Type4TargetItem;
  targets?: Type4TargetItem[];
  actualCollectAmount?: number | string | null;
}

// Backward-compatible alias
export type ApprovalType4CollectProps = Type4ApprovalCardProps;

/**
 * Validation Options & Result
 */
export interface ValidateType4Options {
  items?: Type4CollectItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type4ValidationResult {
  isValid: boolean;
  error?: string;
}
