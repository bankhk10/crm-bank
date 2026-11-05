/**
 * Type 6 Feature: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution)
 * Shared Domain Types & Interfaces
 */

import type { IssueTypeValue } from "./constants";

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

export interface Type6ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
}

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

export interface Type6IssueRecord {
  id?: string;
  targetId?: string;
  productId?: string | null;
  productName?: string | null;
  lotNumber?: string | null;
  purchaseChannel: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string;
  storeId?: string | null;
  storeName?: string | null;
  customerName?: string | null;
  isManualCustomer?: boolean;
  issueType: string;
  detail?: string | null;
  status: "เสร็จสิ้น" | "รอติดตาม" | string;
  problemFound?: string | null;
  initialSolution?: string | null;
  nextAction?: string | null;
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

// Plan Card Types
export interface Type6PlanCardTargetItem {
  id?: string;
  customer?: string;
  customerName?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type6PlanCardTarget {
  customer?: string;
  issueType?: string;
  detail?: string;
  notes?: string;
  items?: Type6PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type6PlanCardProps {
  planType?: string;
  target?: Type6PlanCardTarget | null;
  className?: string;
}
