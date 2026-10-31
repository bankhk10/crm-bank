import type { CustomerOption, ProductOption, Type2ImageFile } from "../../shared/types";

export interface Type2FollowupProductLine {
  id: string;
  productId?: string;
  productName: string;
  notes?: string;
}

export interface Type2ProductFollowupItem {
  id: string;
  visitPurpose?: "FARMER" | "STORE";
  province?: string;
  isUnregisteredFarmer?: boolean;
  storeId?: string;
  customerName: string;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  products?: Type2FollowupProductLine[];
  productId?: string;
  productName?: string;
  detail: string;
}

export type Type2PlannedItem = Type2ProductFollowupItem;

export interface FollowupProductItem {
  id?: string;
  targetId?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  expectedResult?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
  detail?: string;
  followupDetail?: string;
  isAdditional?: boolean;
}

export interface Type2TargetItem {
  id?: string;
  product?: string;
  customer: string;
  storeName?: string;
  storeId?: string;
  keyFarmer?: string;
  province?: string;
  visitPurpose?: "FARMER" | "STORE";
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  detail: string;
  expectedResult: string;
  items?: FollowupProductItem[];
  [key: string]: any;
}

export interface Type2PlanCardTargetItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  detail?: string;
  notes?: string;
  expectedResult?: string;
  isAdditional?: boolean;
  [key: string]: any;
}

export interface Type2PlanCardTarget {
  product?: string;
  customer?: string;
  storeName?: string;
  keyFarmer?: string;
  province?: string;
  visitPurpose?: "FARMER" | "STORE";
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  detail?: string;
  expectedResult?: string;
  items?: Type2PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type2PlanCardProps {
  planType?: string;
  target?: Type2PlanCardTarget;
  className?: string;
}

export interface Type2PlannedFormProps {
  readonly?: boolean;
  type2Items: Type2ProductFollowupItem[];
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export type Type2PlanFormProps = Type2PlannedFormProps;
export type Type2FollowupProps = Type2PlannedFormProps;

export interface Type2DetailViewProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
  followupResults?: FollowupProductItem[];
  customerName?: string;
  detail?: string;
  followupDetail?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
  images?: Type2ImageFile[];
  isActualRecorded?: boolean;
}

export type DetailType2FollowupProps = Type2DetailViewProps;

export interface Type2ApprovalCardProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
}

export type ApprovalType2FollowupProps = Type2ApprovalCardProps;
