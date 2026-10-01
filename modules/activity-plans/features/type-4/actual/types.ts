import type { ImageFile, ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface TargetCollectCompanyItem {
  id?: string;
  customer?: string;
  companyName: string;
  targetCollect: string;
  targetAmountNum?: number;
  collectType?: "BILLING" | "COLLECT";
  receivedAmount?: string;
  billingStatus?: "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ" | "";
  detail?: string;
}

export interface ActualType4CollectProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
    customer?: string;
    orderNo?: string;
    targetCollect?: string;
    collectType?: "BILLING" | "COLLECT";
    items?: TargetCollectCompanyItem[];
  };
  orderNo: string;
  setOrderNo: (v: string) => void;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  billingStatus?: string;
  setBillingStatus?: (v: string) => void;
  collectDetail?: string;
  setCollectDetail?: (v: string) => void;
  paymentImages?: ImageFile[];
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export interface DetailType4CollectProps {
  isVisible: boolean;
  target: {
    customer: string;
    orderNo: string;
    targetCollect: string;
    targetAmountNum?: number;
    collectAmount?: number;
    items?: TargetCollectCompanyItem[];
  };
  orderNo?: string;
  receivedAmount?: string;
  paymentImages?: ImageFile[];
}

export interface ApprovalType4CollectProps {
  isVisible: boolean;
  target: ActualTargetsState["t4"];
  actualCollectAmount?: number | string | null;
}
