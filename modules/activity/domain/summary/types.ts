import React from "react";
import type { Type1TargetItem } from "../../features/type-1";

export interface ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
}

export interface RequisitionItemSummary {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface MarketingProductItemSummary {
  id: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface SalesPromotionItemSummary {
  id: string;
  detail: string;
  amount: number;
  budgetType?: string;
}

export interface PlanSummaryData {
  // ข้อมูลหลักของกิจกรรม (Main Activity Details)
  planNo?: string;
  title: string;
  startDateStr: string;
  endDateStr?: string;
  startTimeStr?: string;
  endTimeStr?: string;
  timeStr: string;
  locationStr: string;

  // งบประมาณและค่าใช้จ่าย (Budget & Expenses)
  marketingBudget?: number;
  salesPromotionBudget?: number;
  extraExpenseAmount?: number;
  extraExpenseDetail?: string;

  targetSales?: number;
  isPromotionalMediaSelected?: boolean;
  marketingProductItems?: MarketingProductItemSummary[];
  isSalesPromotionSelected?: boolean;
  salesPromotionItems?: SalesPromotionItemSummary[];

  // รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition)
  requisitionItems?: RequisitionItemSummary[];

  // ข้อมูลเพิ่มเติม (Additional Info)
  notes?: string;
  objective?: string;
  location?: string;
  province?: string;
  district?: string;
  helperEmployeeNames?: string[];
  helpers?: {
    id: string;
    name: string;
    positionTitle?: string;
    departmentName?: string;
  }[];
  stores?: {
    storeId: string;
    storeName: string;
    workTypeCode?: string;
  }[];
}

export interface ActualTargetItem {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
  colSpan?: string;
}

export type ActivityResultStatusType =
  | "PARTIAL"
  | "COMPLETED"
  | "POSTPONED"
  | "CANCELLED";

// ────────────────────────────────────────────────────────
// Work Type Target Items (Type 1 - 14)
// ────────────────────────────────────────────────────────

export type Type2TargetItem = any;
import type { Type3TargetItem } from "../../features/type-3";
export type Type4TargetItem = any;
export type Type5TargetItem = any;
export type Type6TargetItem = any;
export type Type7aTargetItem = any;
export type Type7bTargetItem = any;
export type Type8TargetItem = any;
export type Type9TargetItem = any;
import type { Type10TargetItem } from "../../features/type-10";
import type { Type11TargetItem } from "../../features/type-11";
import type { Type12TargetItem } from "../../features/type-12";
import type { Type13TargetItem } from "../../features/type-13";
import type { Type14TargetItem } from "../../features/type-14";
export type {
  Type3TargetItem,
  Type10TargetItem,
  Type11TargetItem,
  Type12TargetItem,
  Type13TargetItem,
  Type14TargetItem,
};

export interface ActualTargetsState {
  t1: Type1TargetItem;
  t1List?: Type1TargetItem[];
  t2?: Type2TargetItem;
  t3?: Type3TargetItem;
  t3List?: Type3TargetItem[];
  t4?: Type4TargetItem;
  t4List?: Type4TargetItem[];
  t5?: Type5TargetItem;
  t6?: Type6TargetItem;
  t7?: Type7aTargetItem;
  t7b?: Type7bTargetItem;
  t8?: Type8TargetItem;
  t9?: Type9TargetItem;
  t10?: Type10TargetItem;
  t11?: Type11TargetItem;
  t12?: Type12TargetItem;
  t13?: Type13TargetItem;
  t14?: Type14TargetItem;
  [key: string]: any;
}

export interface ExtractedPlanData {
  planSummary: PlanSummaryData;
  resolvedWorkTypes: string[];
  targets: ActualTargetsState;
  t9Extra?: {
    mainStore: string;
    isSubDealer: boolean;
    subDealerStore: string;
    productSummary: string;
    totalSales: number;
    items: any[];
  };
  t7StartDate?: string;
  t7PlotIdentifier?: string;
}

export interface FollowupProductItem {
  id?: string;
  productId: string;
  productName: string;
  customer?: string;
  storeId?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | string;
  problemDetail?: string;
  followupDetail?: string;
  isAdditional?: boolean;
}

export interface Type5SurveyRecord {
  id?: string;
  storeId?: string;
  storeName?: string;
  productId?: string;
  productName?: string;
  sellingPrice?: number;
  promotionDetails?: string;
}

export interface Type6IssueRecord {
  id?: string;
  storeId?: string;
  storeName?: string;
  issueType?: string;
  issueDetail?: string;
  resolutionStatus?: string;
}

export interface Type7bSprayingRoundItem {
  roundNumber?: number;
  sprayDate?: string;
  dosage?: string;
  waterVolume?: number;
}

export interface ParsedSummaryValues {
  // Activity Result Status & Postponed / Cancelled
  activityResultStatus?: ActivityResultStatusType;
  cancelReason?: string;
  actualStartDate?: string;
  t7StartDate?: string;
  postponedDate?: string;
  postponedTime?: string;
  postponedReason?: string;
  postponedNotes?: string;

  // Common/numeric fields
  problemFound?: string;
  nextAction?: string;

  // Type 1
  t1ProductAdvice?: string;
  t1SalesOpportunity?: "สูง" | "ต่ำ" | string;
  t1DiscussionResult?: string;
  t1Detail?: string;
  t1NextAction?: string;
  t1NextMeetingDate?: string;
  t1FarmerHomeAddress?: string;
  t1PlotLatitude?: string | number | null;
  t1PlotLongitude?: string | number | null;
  t1PlotImages?: ImageFile[];

  // Type 2
  t2CustomerName?: string;
  t2FollowupDetail?: string;
  t2Detail?: string;
  t2UsageResult?: "พืชตอบสนองดี" | "พบปัญหา" | string;
  t2ProblemDetail?: string;
  t2FollowupResults?: FollowupProductItem[];
  t2Images?: ImageFile[];

  // Type 3
  t3SoldProducts?: string;
  t3ActualSales?: string;
  t3ActualQuantity?: string | number;
  t3UnclosedReason?: string;

  // Type 4
  t4ActualCollect?: string;
  t4Items?: any[];

  // Type 5
  t5SurveyRecords?: Type5SurveyRecord[];

  // Type 6
  t6IssueRecords?: Type6IssueRecord[];

  // Type 7A / 7B
  t7PlotObservation?: string;
  t7GrowthStatus?: string;
  t7IssuesFound?: string;
  t7bSprayingRounds?: Type7bSprayingRoundItem[];

  // Type 8
  actualAttendeesCount?: number | string;
  actualAttendees?: number | string;
  t8ActualAttendees?: string;
  t8FeedbackQnA?: string;
  t8ProductSalesDetails?: any[];
  t8Images?: ImageFile[];
  t8RegistrationImages?: ImageFile[];
  type8Actual?: any;

  // Type 12
  t12ActualAttendees?: number | string;
  t12TourHighlights?: string;
  t12FeedbackIssues?: string;
  t12Images?: ImageFile[];

  // Type 13
  t13Plots?: any[];
  t13SprayRounds?: any[];
  t13Images?: ImageFile[];
  type13Actual?: any;

  // Type 14
  t14Plots?: any[];
  t14FollowUpRounds?: any[];
  t14Images?: ImageFile[];
  type14Actual?: any;

  // General index signature for extensible fields
  [key: string]: any;
}
