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

export interface ActualTargetsState {
  t1: {
    customer: string;
    topic: string;
    detail: string;
    opportunity: string;
    nextDate: string;
    visitPurpose?: "FARMER" | "STORE";
    customerType?: string;
    province?: string;
    isUnregisteredFarmer?: boolean;
    unregisteredFarmerName?: string;
    unregisteredFarmerPhone?: string;
    farmerHomeAddress?: string;
    plotLatitude?: string | number | null;
    plotLongitude?: string | number | null;
    plotImages?: ImageFile[];
  };
  t2: {
    product: string;
    customer: string;
    storeName?: string;
    keyFarmer?: string;
    detail: string;
    expectedResult: string;
    items: any[];
  };
  t3: {
    product: string;
    customer: string;
    targetQty: string;
    unitPrice?: string;
    targetSales: string;
    detail?: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    dealerName?: string;
    items: any[];
  };
  t4: {
    customer: string;
    orderNo: string;
    targetCollect: string;
    collectType?: "BILLING" | "COLLECT";
    targetAmountNum?: number;
    collectAmount?: number;
    actualCollectAmount?: number | null;
    items: any[];
  };
  t5: {
    store: string;
    product: string;
    detail: string;
    items: any[];
  };
  t6: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus: string;
    items: any[];
  };
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
    targetCondition: string;
    items: any[];
  };
  t7a?: {
    activityType?: string;
    owner: string;
    plotName?: string;
    dealerName?: string;
    dealerCode?: string;
    province?: string;
    district?: string;
    categoryName?: string;
    categoryCode?: string;
    chemicalGroupName?: string;
    cropCategory?: string;
    product: string;
    productId?: string;
    plannedProductId?: string;
    crop: string;
    plots: string;
    areaRai?: number | null;
    treeCount?: number | null;
    demoProductQuantity: string;
    demoProducts?: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unit?: string | null;
    }>;
    objective: string;
    experimentDetail: string;
    detail: string;
    targetCondition: string;
    items: any[];
  };
  t7b?: {
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
    targetCondition: string;
    items: any[];
    plotName?: string;
    plotCode?: string;
  };
  t8: {
    topic: string;
    products: string;
    targetAttendees: string;
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
  store: string;
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
  productId: string;
  productName: string;
  baselineRate?: string;
  withdrawnQuantity?: number | string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string;
}

export interface Type7bSprayingRoundItem {
  id?: string;
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


