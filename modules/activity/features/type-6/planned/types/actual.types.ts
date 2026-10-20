/**
 * Type 6 Feature: Actual & View Types & Interfaces
 */

import type { ImageFile } from "@/modules/activity/domain/summary/types";
import type {
  Type6TargetItem,
  Type6IssueRecord,
  Type6ImageFile,
} from "../../shared/types";

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
  setPurchaseChannel?: (v: any) => void;
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
}

export type ActualType6IssueProps = Type6ActualFormProps;

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
  images?: ImageFile[] | Type6ImageFile[];

  // Legacy fallback props
  problemDetail?: string;
  initialSolution?: string;
}

export type DetailType6IssueProps = Type6DetailViewProps;

export interface Type6ApprovalCardProps {
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
  images?: ImageFile[] | Type6ImageFile[];
  problemDetail?: string;
  initialSolution?: string;
}

export type ApprovalType6IssueProps = Type6ApprovalCardProps;

export interface Type6ActualValidationInput {
  t6PurchaseChannel?: string;
  t6StoreId?: string | null;
  t6ProductId?: string | null;
  t6LotNumber?: string;
  t6IssueType?: string;
  t6Detail?: string;
}
