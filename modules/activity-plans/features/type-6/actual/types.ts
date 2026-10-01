import type React from "react";
import type {
  ActualTargetsState,
  ImageFile,
  Type6IssueRecord,
} from "@/modules/activity-plans/features/shared/actual-view/types";

export interface TargetIssueItem {
  customer: string;
  issueType: string;
  detail: string;
}

export interface ActualType6IssueProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
    customer?: string;
    issueType?: string;
    detail?: string;
    targetStatus?: string;
    items?: TargetIssueItem[];
  };
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

  // Legacy fallback props (for backward compatibility)
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  initialSolution?: string;
  setInitialSolution?: (v: string) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export interface DetailType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus?: string;
    items?: any[];
  };
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

export interface ApprovalType6IssueProps {
  isVisible: boolean;
  target: ActualTargetsState["t6"];
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
