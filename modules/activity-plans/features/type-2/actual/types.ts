import type {
  FollowupProductItem,
  Type2TargetItem,
  Type2ImageFile,
} from "../types";

export type { FollowupProductItem, Type2TargetItem, Type2ImageFile };

export interface ActualType2FollowupProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
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
  setUsageResult?: (v: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "") => void;
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  images?: Type2ImageFile[];
  setImages?: (v: Type2ImageFile[]) => void;
}
