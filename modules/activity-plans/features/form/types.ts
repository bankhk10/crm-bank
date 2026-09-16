export interface RequisitionItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export interface Type9ProductItem {
  id: string;
  productId?: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface Type1VisitItem {
  id: string;
  visitPurpose?: "FARMER" | "STORE";
  province?: string;
  isUnregisteredFarmer?: boolean;
  storeId?: string;
  customerName?: string;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  topic: string;
  detail: string;
}

export interface Type2ProductFollowupItem {
  id: string;
  storeId?: string;
  customerName: string;
  productId?: string;
  productName: string;
  detail: string;
}

export interface Type3SalesProductLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  notes?: string;
  unitPrice?: number;
  masterPrice?: number;
  isPriceOverridden?: boolean;
  price?: number;
}

export interface Type3SalesItem {
  id: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  storeId?: string;
  customerName: string;
  products?: Type3SalesProductLine[];
  productId?: string;
  productName?: string;
  quantity?: number;
  notes?: string;
  unitPrice?: number;
  masterPrice?: number;
  isPriceOverridden?: boolean;
  price?: number;
  detail?: string;
}

export interface Type4CollectItem {
  id: string;
  storeId?: string;
  customerName: string;
  collectAmount: number;
  detail: string;
}

export interface Type5SurveyItem {
  id: string;
  storeId?: string;
  storeName: string;
  productId?: string;
  comparedProduct: string;
  detail: string;
}

export interface Type6IssueItem {
  id: string;
  storeId?: string;
  customerName: string;
  issueType: string;
  detail: string;
}

export type PlotActivityType = "CREATE" | "FOLLOW_UP";

export interface Type7DemoPlotItem {
  id: string;
  plotActivityType?: PlotActivityType; // "CREATE" (ทำแปลงสาธิต) | "FOLLOW_UP" (ติดตามแปลงสาธิต)

  // Fields for CREATE (ทำแปลงสาธิต) & shared
  demoPlotId?: string;
  storeId?: string;
  ownerName: string;
  productId?: string;
  productName: string;
  productUnit?: string;
  cropCategory: string;
  cropName: string;
  customCropName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  objective?: string;
  plotsCount?: number | string | null; // จำนวนสินค้าที่จะสาธิต
  experimentDetail?: string;
  detail: string;

  // Fields for FOLLOW_UP (ติดตามแปลงสาธิต)
  existingPlotId?: string;
  existingPlotName?: string;
  followUpDate?: string;
  growthStage?: string;
  plotStatus?: string;
  followUpResult?: string;
  problemDescription?: string;
  recommendation?: string;
  plotImages?: string[];
}

export interface Type8MeetingItem {
  id: string;
  topic: string;
  targetProductIds?: string[];
  targetProducts?: string[];
  attendeesCount: number;
  detail: string;
}

export interface Type11StoreItem {
  storeId: string;
  storeName: string;
}

export interface MarketingBudgetProductItem {
  id: string;
  category?: string;
  customCategory?: string;
  productName: string;
  quantityCases: number;
  unit?: string;
  pricePerCase: number;
}

export interface SalesPromotionItem {
  id: string;
  budgetType: string;
  detail: string;
  amount: number;
}
