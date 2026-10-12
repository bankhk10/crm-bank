import type {
  TargetCollectCompanyItem,
  Type4TargetItem,
  Type4ImageFile,
} from "../types";

export type { TargetCollectCompanyItem, Type4TargetItem, Type4ImageFile };

export interface ActualType4CollectProps {
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

export interface DetailType4CollectProps {
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

export interface ApprovalType4CollectProps {
  isVisible: boolean;
  target?: Type4TargetItem;
  targets?: Type4TargetItem[];
  actualCollectAmount?: number | string | null;
}
