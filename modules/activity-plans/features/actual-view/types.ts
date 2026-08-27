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
  value: string;
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
    items: any[];
  };
  t4: {
    customer: string;
    orderNo: string;
    targetCollect: string;
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
    crop: string;
    plots: string;
    demoProductQuantity: string;
    objective: string;
    experimentDetail: string;
    detail: string;
    targetCondition: string;
    items: any[];
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
  };
}

export interface Type5SurveyRecord {
  id?: string;
  store: string;
  product: string;
  detail?: string;
  competitorBrand: string;
  competitorProduct: string;
  competitorPrice: string;
  competitorUnit?: string;
  promotionDetail: string;
  priceTagImages?: ImageFile[];
  shelfImages?: ImageFile[];
}

