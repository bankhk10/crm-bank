export interface RequisitionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export interface Type9ProductItem {
  id: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface Type1VisitItem {
  id: string;
  customerName: string;
  topic: string;
  detail: string;
}

export interface Type2ProductFollowupItem {
  id: string;
  productName: string;
  customerName: string;
  detail: string;
}

export interface Type3SalesProductLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  price: number;
}

export interface Type3SalesItem {
  id: string;
  customerName: string;
  products?: Type3SalesProductLine[];
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  detail: string;
}

export interface Type4CollectItem {
  id: string;
  customerName: string;
  collectAmount: number;
  detail: string;
}

export interface Type5SurveyItem {
  id: string;
  comparedProduct: string;
  storeName: string;
  detail: string;
}

export interface Type6IssueItem {
  id: string;
  customerName: string;
  issueType: string;
  detail: string;
}

export type PlotActivityType = "CREATE" | "FOLLOW_UP";

export interface Type7DemoPlotItem {
  id: string;
  plotActivityType?: PlotActivityType; // "CREATE" (ทำแปลงสาธิต) | "FOLLOW_UP" (ติดตามแปลงสาธิต)

  // Fields for CREATE (ทำแปลงสาธิต) & shared
  ownerName: string;
  productName: string;
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
  targetProducts?: string[];
  attendeesCount: number;
  detail: string;
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
