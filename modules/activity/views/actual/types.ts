// =============================================================================
// ACTUAL VIEW SHARED TYPES
// Types for Common Actual Screen Components (Plan Summary & Status)
// Note: Work type specific types live in @/modules/activity/features/type-X
// =============================================================================

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

export type ActivityResultStatusType =
  | "PARTIAL"
  | "COMPLETED"
  | "POSTPONED"
  | "CANCELLED";
