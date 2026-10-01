export interface Type6IssueItem {
  id: string;
  storeId?: string | null;
  customerName: string;
  manualCustomerName?: string;
  isManualCustomer?: boolean;
  issueType: string;
  detail: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  code?: string | null;
  isKeyFarmer?: boolean;
}

export const ISSUE_TYPES = [
  "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  "เกิดความเสียหายหลังการใช้สินค้า",
  "อื่นๆ ระบุ",
] as const;

export type IssueTypeValue = (typeof ISSUE_TYPES)[number];
