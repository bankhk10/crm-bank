export interface CustomerOption {
  id: string;
  name: string;
  code?: string | null;
  isKeyFarmer?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

export const ISSUE_TYPES = [
  "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  "เกิดความเสียหายหลังการใช้สินค้า",
  "อื่นๆ ระบุ",
] as const;

export type IssueTypeValue = (typeof ISSUE_TYPES)[number];

export interface Type6IssueItem {
  id: string;
  storeId?: string | null;
  customerName: string;
  manualCustomerName?: string;
  isManualCustomer?: boolean;
  issueType: string;
  detail: string;
}

export interface TargetIssueItem {
  customer: string;
  issueType: string;
  detail: string;
}

export interface Type6ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface Type6IssueRecord {
  id?: string;
  productId?: string | null;
  productName?: string | null;
  lotNumber?: string | null;
  purchaseChannel: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string;
  storeId?: string | null;
  storeName?: string | null;
  issueType: string;
  detail?: string | null;
  status: "เสร็จสิ้น" | "รอติดตาม" | string;
  images?: Type6ImageFile[];
}

export interface Type6TargetItem {
  id?: string;
  storeId?: string | null;
  customer?: string;
  customerName?: string;
  manualCustomerName?: string;
  isManualCustomer?: boolean;
  issueType?: string;
  detail?: string;
  targetStatus?: string;
  items?: TargetIssueItem[];
}
