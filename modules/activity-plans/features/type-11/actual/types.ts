import type {
  ImageFile,
  ActualTargetsState,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import type { StockCheckItem } from "../shared/types";

export type { StockCheckItem };

export interface ActualType11StockProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
    store?: string;
    detail?: string;
    targetOpportunity?: string;
    items?: Array<{ storeId?: string; store?: string; detail?: string }>;
  };
  products?: Array<{ id: string; name: string; productCode?: string | null } | string>;
  productList?: string;
  setProductList?: (v: string) => void;
  remainingQty?: string;
  setRemainingQty?: (v: string) => void;
  remarks?: string;
  setRemarks?: (v: string) => void;
  stockItems?: StockCheckItem[];
  setStockItems?: (items: StockCheckItem[]) => void;
  nextAction?: string;
  setNextAction?: (v: string) => void;
  images?: ImageFile[];
  setImages?: (v: ImageFile[]) => void;
}

export interface DetailType11StockProps {
  isVisible: boolean;
  target: {
    store: string;
    detail: string;
    targetOpportunity: string;
  };
  productList?: string;
  remainingQty?: string;
  remarks?: string;
  stockItems?: StockCheckItem[];
  stockStatus?: "ใกล้หมด" | "ขาดสต็อก" | "";
  reorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  nextAction?: string;
  images?: ImageFile[];
}

export interface ApprovalType11StockProps {
  isVisible: boolean;
  target: ActualTargetsState["t11"];
}
