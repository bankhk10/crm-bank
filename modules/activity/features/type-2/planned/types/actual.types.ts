import type { Type2TargetItem, FollowupProductItem } from "./planned.types";
import type { Type2ImageFile } from "../../shared/types";

export type { FollowupProductItem };

export interface Type2ActualFormProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
  planType?: "PLANNED" | "UNPLANNED" | string;
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  followupResults?: FollowupProductItem[];
  onUpdateFollowupResults?: (items: FollowupProductItem[]) => void;
  // Backward-compatible individual field props
  customerName?: string;
  setCustomerName?: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  followupDetail?: string;
  setFollowupDetail?: (v: string) => void;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  setUsageResult?: (
    v: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "",
  ) => void;
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  images?: Type2ImageFile[];
  setImages?: (v: Type2ImageFile[]) => void;
}

export type ActualType2FollowupProps = Type2ActualFormProps;

export interface Type2ActualData {
  followupResults: FollowupProductItem[];
  images?: Type2ImageFile[];
}
