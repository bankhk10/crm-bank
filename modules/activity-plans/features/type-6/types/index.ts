import type React from "react";
import type {
  ActualTargetsState,
  ImageFile,
} from "@/modules/activity-plans/features/shared/actual-view/types";

/**
 * Type 6 (ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา - Customer Complaint / Issue Resolution)
 * Domain Types & Interfaces
 */

export interface CustomerOption {
  id: string;
  name: string;
  code?: string | null;
  isKeyFarmer?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

export const ISSUE_TYPES = [
  "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  "เกิดความเสียหายหลังการใช้สินค้า",
  "อื่นๆ ระบุ",
] as const;

export type IssueTypeValue = (typeof ISSUE_TYPES)[number];

export interface Type6IssueItem {
  id: string;
  storeId?: string | null;
  customerName: string;
  manualCustomerName?: string;
  isManualCustomer?: boolean;
  issueType: string;
  detail: string;
}

export interface TargetIssueItem {
  customer: string;
  issueType: string;
  detail: string;
}

export interface Type6ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface Type6IssueRecord {
  id?: string;
  productId?: string | null;
  productName?: string | null;
  lotNumber?: string | null;
  purchaseChannel: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string;
  storeId?: string | null;
  storeName?: string | null;
  issueType: string;
  detail?: string | null;
  status: "เสร็จสิ้น" | "รอติดตาม" | string;
  images?: Type6ImageFile[];
}

export interface Type6TargetItem {
  id?: string;
  storeId?: string | null;
  customer?: string;
  customerName?: string;
  manualCustomerName?: string;
  isManualCustomer?: boolean;
  issueType?: string;
  detail?: string;
  targetStatus?: string;
  items?: TargetIssueItem[];
}

// ============================================================================
// Plan Card Props & Target Types
// ============================================================================

export interface Type6PlanCardTargetItem {
  id?: string;
  customer?: string;
  customerName?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type6PlanCardTarget {
  customer?: string;
  issueType?: string;
  detail?: string;
  notes?: string;
  items?: Type6PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type6PlanCardProps {
  planType?: string;
  target?: Type6PlanCardTarget | null;
  className?: string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

export interface Type6PlanFormProps {
  isVisible?: boolean;
  customers: CustomerOption[];
  type6Items: Type6IssueItem[];
  addType6Row: () => void;
  updateType6Row: (id: string, field: keyof Type6IssueItem, val: any) => void;
  deleteType6Row: (id: string) => void;
  title?: string;
  isPlanned?: boolean;
  readonly?: boolean;
}

export interface Type6ActualFormProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type6TargetItem;
  targets?: Type6TargetItem[];
  // Products & Customers options
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  customers?: Array<{ id: string; name: string; customerCode?: string | null }>;

  // Form Fields
  productId?: string | null;
  setProductId?: (v: string | null) => void;
  productName?: string | null;
  setProductName?: (v: string | null) => void;
  lotNumber?: string;
  setLotNumber?: (v: string) => void;
  purchaseChannel?: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string;
  setPurchaseChannel?: (v: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string) => void;
  storeId?: string | null;
  setStoreId?: (v: string | null) => void;
  storeName?: string | null;
  setStoreName?: (v: string | null) => void;
  issueType?: string;
  setIssueType?: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  status: "เสร็จสิ้น" | "รอติดตาม" | "";
  setStatus: (v: "เสร็จสิ้น" | "รอติดตาม" | "") => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  readonly?: boolean;

  // Legacy fallback props
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  initialSolution?: string;
  setInitialSolution?: (v: string) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export interface Type6DetailViewProps {
  isVisible: boolean;
  target?: Type6TargetItem;
  targets?: Type6TargetItem[];
  issueRecord?: Type6IssueRecord;
  productName?: string;
  lotNumber?: string;
  purchaseChannel?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  status?: "เสร็จสิ้น" | "รอติดตาม" | string;
  images?: ImageFile[];

  // Legacy fallback props
  problemDetail?: string;
  initialSolution?: string;
}

export interface Type6ApprovalCardProps {
  isVisible: boolean;
  target?: Type6TargetItem | ActualTargetsState["t6"];
  targets?: Type6TargetItem[];
  issueRecord?: Type6IssueRecord;
  productName?: string;
  lotNumber?: string;
  purchaseChannel?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  status?: "เสร็จสิ้น" | "รอติดตาม" | string;
  images?: ImageFile[];
  problemDetail?: string;
  initialSolution?: string;
}

// ============================================================================
// Application Validation Types
// ============================================================================

export interface ValidateType6Options {
  items?: Type6IssueItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type6ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Type6ActualValidationInput {
  t6PurchaseChannel?: string;
  t6StoreId?: string | null;
  t6ProductId?: string | null;
  t6LotNumber?: string;
  t6IssueType?: string;
  t6Detail?: string;
}

// ============================================================================
// Backward-Compatible Aliases
// ============================================================================

export type Type6IssueProps = Type6PlanFormProps;
export type ActualType6IssueProps = Type6ActualFormProps;
export type DetailType6IssueProps = Type6DetailViewProps;
export type ApprovalType6IssueProps = Type6ApprovalCardProps;
export type EditCustomerOption = CustomerOption;
export type EditType6IssueProps = Type6PlanFormProps;
