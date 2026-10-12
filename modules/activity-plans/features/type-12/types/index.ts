export type TourType =
  | "ทัวร์กลาง"
  | "ทัวร์ร้านค้า"
  | "CENTRAL"
  | "STORE"
  | string;

export type TourSize =
  | "ทัวร์เล็ก"
  | "ทัวร์ใหญ่"
  | "SMALL"
  | "LARGE"
  | string;

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface Type12TourDataPayload {
  tourType: "STORE" | "CENTRAL";
  tourSize: "LARGE" | "SMALL" | null;
  country: string | null;
  storeId: string | null;
  destination: string | null;
}

export interface Type12TargetItem {
  id?: string;
  tourType: TourType;
  tourSize?: TourSize | null;
  country?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  destination?: string | null;
  detail?: string;
  [key: string]: any;
}

export interface Type12PlanItem {
  tourType: "STORE" | "CENTRAL";
  tourSize?: "LARGE" | "SMALL" | null;
  country?: string | null;
  storeId?: string | null;
  destination?: string | null;
}

export interface Type12PlanCardProps {
  isVisible?: boolean;
  planType?: string | null;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  tourType?: TourType | string | null;
  tourSize?: TourSize | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
  className?: string;
  [key: string]: any;
}

export interface DetailType12TourProps {
  isVisible: boolean;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  tourType?: TourType | string | null;
  tourSize?: TourSize | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
}

export interface ApprovalType12TourProps {
  isVisible: boolean;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  tourType?: TourType | string | null;
  tourSize?: TourSize | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
}
