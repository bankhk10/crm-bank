export interface RequisitionItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export type { Type9ProductItem } from "@/modules/activity-plans/features/type-9/shared/types";

export type { Type1VisitItem } from "@/modules/activity-plans/features/type-1/shared/types";

export type { Type2ProductFollowupItem } from "@/modules/activity-plans/features/type-2/shared/types";

export type {
  Type3SalesProductLine,
  Type3SalesItem,
} from "@/modules/activity-plans/features/type-3/shared/types";

export type { Type4CollectItem } from "@/modules/activity-plans/features/type-4/shared/types";

export type { Type5SurveyItem } from "@/modules/activity-plans/features/type-5/shared/types";

export type { Type6IssueItem } from "@/modules/activity-plans/features/type-6/shared/types";


export type PlotActivityType = "CREATE" | "FOLLOW_UP";

export type { Type7DemoProductLine } from "@/modules/activity-plans/features/type-7a/shared/types";
export type { Type7bWithdrawnProductLine } from "@/modules/activity-plans/features/type-7b/shared/types";

export interface Type7DemoPlotItem {
  id: string;
  plotActivityType?: PlotActivityType; // "CREATE" (ทำแปลงสาธิต) | "FOLLOW_UP" (ติดตามแปลงสาธิต)

  // Fields for CREATE (ทำแปลงสาธิต) & shared
  demoPlotId?: string;
  plotName?: string;
  province?: string;
  district?: string;
  categoryId?: string;
  chemicalGroupId?: string; // Kept for backwards compatibility
  demoProducts?: Type7DemoProductLine[];
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
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type7bWithdrawnProductLine[];
  followUpDate?: string;
  growthStage?: string;
  plotStatus?: string;
  followUpResult?: string;
  problemDescription?: string;
  recommendation?: string;
  plotImages?: string[];
}


export type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8MeetingItem,
} from "@/modules/activity-plans/features/type-8/shared/types";


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
