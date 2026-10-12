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

  // งบประมาณและค่าใช้จ่าย (Budget & Expenses) (ถ้ามี)
  marketingBudget?: number;
  salesPromotionBudget?: number;
  extraExpenseAmount?: number;
  extraExpenseDetail?: string;

  targetSales?: number;
  isPromotionalMediaSelected?: boolean;
  marketingProductItems?: MarketingProductItemSummary[];
  isSalesPromotionSelected?: boolean;
  salesPromotionItems?: SalesPromotionItemSummary[];

  // รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition) (ถ้ามี)
  requisitionItems?: RequisitionItemSummary[];

  // ข้อมูลเพิ่มเติม (Additional Info) (ถ้ามี)
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

import type { Type1TargetItem } from "@/modules/activity-plans/features/type-1/types";
import type { Type2TargetItem } from "@/modules/activity-plans/features/type-2/types";
import type { Type3TargetItem } from "@/modules/activity-plans/features/type-3/types";
import type { Type4TargetItem } from "@/modules/activity-plans/features/type-4/types";
import type { Type5TargetItem } from "@/modules/activity-plans/features/type-5/types";
import type { Type6TargetItem } from "@/modules/activity-plans/features/type-6/types";
import type { Type7aTargetItem } from "@/modules/activity-plans/features/type-7a/types";
import type { Type7bTargetItem } from "@/modules/activity-plans/features/type-7b/types";

// Re-export for backward compatibility
export type Type1TargetStateItem = Type1TargetItem;
export type Type2TargetStateItem = Type2TargetItem;
export type Type3TargetStateItem = Type3TargetItem;
export type Type4TargetStateItem = Type4TargetItem;
export type Type5TargetStateItem = Type5TargetItem;
export type Type6TargetStateItem = Type6TargetItem;
export type Type7aTargetStateItem = Type7aTargetItem;
export type Type7bTargetStateItem = Type7bTargetItem;

export interface ActualTargetsState {
  t1: Type1TargetItem;
  t1List?: Type1TargetItem[];
  t2: Type2TargetItem;
  t2List?: Type2TargetItem[];
  t3: Type3TargetItem;
  t3List?: Type3TargetItem[];
  t4: Type4TargetItem;
  t4List?: Type4TargetItem[];
  t5: Type5TargetItem;
  t5List?: Type5TargetItem[];
  t6: Type6TargetItem;
  t6List?: Type6TargetItem[];
  t7: {
    activityType?: string;
    owner: string;
    product: string;
    productId?: string;
    plannedProductId?: string;
    crop: string;
    plots: string;
    demoProductQuantity: string;
    objective: string;
    experimentDetail: string;
    detail: string;
    dealerName?: string;
    dealerCode?: string;
    demoProducts?: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unit?: string | null;
    }>;
    targetCondition?: string;
    items: any[];
  };
  t7a?: Type7aTargetItem;
  t7aList?: Type7aTargetItem[];
  t7b?: Type7bTargetItem;
  t7bList?: Type7bTargetItem[];
  t8: {
    topic: string;
    products: string;
    targetAttendees: string;
    customer?: string;
    dealerName?: string;
    subDealerStore?: string;
    detail?: string;
    targetProducts?: string[];
    promotionalProducts?: Array<{
      id?: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      notes?: string;
      storeId?: string | null;
    }>;
  };
  t9: {
    store: string;
    isSubDealer: boolean;
    subDealerStore: string;
    product: string;
    targetSales: string;
    targetAttendees: string;
    items: any[];
  };
  t10: {
    plot: string;
    location: string;
    showcase: string;
    targetAttendees: string;
    targetSales: string;
  };
  t11: {
    store: string;
    detail: string;
    targetOpportunity: string;
    items?: any[];
  };
}

export interface Type5SurveyRecord {
  id?: string;
  storeId?: string;
  store: string;
  productId?: string;
  product: string;
  detail?: string;
  competitorBrand: string;
  competitorProduct: string;
  // Normalized 4-tier pricing
  posPrice?: string | number | null;
  dealerPrice?: string | number | null;
  subdealerPrice?: string | number | null;
  farmerPrice?: string | number | null;
  // Highlights
  sellingPoints?: string;
  // Attachments (up to 2 bottle photos, up to 3 promo photos)
  bottleImages?: ImageFile[];
  promotionalImages?: ImageFile[];

  // Legacy fields (optional for backward compatibility)
  competitorPrice?: string;
  competitorUnit?: string;
  promotionDetail?: string;
  priceTagImages?: ImageFile[];
  shelfImages?: ImageFile[];
}

export interface FollowupProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  expectedResult?: string;
  usageResult?: "ลูกค้าพึงพอใจ" | "พบปัญหา" | "พืชตอบสนองดี" | "";
  problemDetail?: string;
  detail?: string; // รายละเอียดเพิ่มเติมจากแผนงาน
  followupDetail?: string; // รายละเอียดการติดตามจากการปฏิบัติงานจริง
  isAdditional?: boolean; // false = สินค้าตามแผน, true = สินค้าเพิ่มเติม
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
  images?: ImageFile[];
}

export interface DemoPlotProductItem {
  id?: string;
  productId: string;
  productName?: string;
  plannedQuantity?: number | string | null;
  quantity: number | string; // Actual Used Quantity (Source of Truth for used quantity)
  remainingQuantity?: number | string | null; // Actual Remaining Quantity
  unit?: string | null;
  applicationRate: string; // Single Source of Truth for product application rate
  isAdditional?: boolean; // Flag to differentiate additional products from planned baseline products
}

export interface DemoPlotExternalProductItem {
  id?: string;
  company: string;
  productName: string;
  activeIngredient?: string;
  formula: string; // SL, SC, EC, EW, ZC, OD, WP, WG, อื่นๆ
  customFormula?: string;
  applicationRate: string;
}

export interface Type7aDemoPlotData {
  customerId?: string | null;
  farmerCustomerId?: string | null;
  ownerName: string;
  ownerPhone?: string | null;
  isUnregisteredFarmer: boolean;
  province: string;
  district?: string | null;
  latitude: number | string;
  longitude: number | string;
  plotName: string;
  dealerName?: string | null;
  cropCategory: string;
  cropName: string;
  customCropName?: string | null;
  areaRai?: number | string | null;
  treeCount?: number | string | null;
  objective?: string | null;
  experimentDetail?: string | null;
  mainCropInfo?: string | null;
  plantingDate?: string | Date | null;
  initialSprayDate?: string | Date | null;
  nextSprayDate?: string | Date | null;
  demoProducts: DemoPlotProductItem[];
  sprayMethod: "SINGLE" | "TANK_MIXED";
  hasExternalChemicals: boolean;
  externalProducts?: DemoPlotExternalProductItem[];
  irrigations: string[];
  usageMethod?: string | null;
  notes?: string | null;
  cropAgeValue?: number | string | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  productResponse?: string | null;
}

export interface Type7bProductRateItem {
  productId: string;
  productName: string;
  baselineRate?: string;
  actualRate: string;
  quantityUsed?: number | string;
  unit?: string;
}

export interface Type7bSprayProductRateItem {
  id?: string;
  productId: string;
  productName: string;
  baselineRate?: string;
  withdrawnQuantity?: number | string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string;
  detail?: string;
  isAdditional?: boolean;
}

export interface Type7bSprayingRoundItem {
  id?: string;
  demoPlotId?: string | null;
  roundNumber: number;
  sprayDate?: string;
  sprayMethod: "SINGLE" | "TANK_MIXED";
  hasExternalChemicals?: boolean;
  externalProducts?: DemoPlotExternalProductItem[];
  sprayEquipment: string;
  otherEquipment?: string;
  productResponse: string;
  problemDetail?: string;
  productRates: Type7bSprayProductRateItem[];
  plotImages: ImageFile[];
}

export type { ParsedSummaryValues } from "./utils/summary-parser";


