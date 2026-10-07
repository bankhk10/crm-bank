import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface FollowupProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  expectedResult?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
  detail?: string; // รายละเอียดเพิ่มเติมจากแผนงาน
  followupDetail?: string; // รายละเอียดการติดตามจากการปฏิบัติงานจริง
  isAdditional?: boolean; // false = สินค้าตามแผน, true = ติดตามผลเพิ่มเติม
}

export interface ActualType2FollowupProps {
  isVisible: boolean;
  target?: {
    product: string;
    customer: string;
    storeName?: string;
    keyFarmer?: string;
    detail: string; // รายละเอียดเพิ่มเติมจากแผนงาน
    expectedResult: string;
    items?: FollowupProductItem[];
  };
  planType?: "PLANNED" | "UNPLANNED" | string;
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  followupResults?: FollowupProductItem[];
  onUpdateFollowupResults?: (items: FollowupProductItem[]) => void;
  // Legacy / backward-compatible props
  customerName?: string;
  setCustomerName?: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  followupDetail?: string;
  setFollowupDetail?: (v: string) => void;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  setUsageResult?: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  images?: ImageFile[];
  setImages?: (v: ImageFile[]) => void;
}
