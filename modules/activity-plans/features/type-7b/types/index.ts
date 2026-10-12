import type { ProductOption, Type7DemoProductLine } from "@/modules/activity-plans/features/type-7a/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";

export type { ProductOption, UserDemoPlotOption, Type7DemoProductLine, Type7DemoPlotItem };

export interface Type7bWithdrawnProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface Type7bPlotInput {
  id?: string;
  demoPlotId?: string | null;
  plotName?: string | null;
  cropName?: string | null;
  farmerName?: string | null;
  ownerName?: string | null;
  province?: string | null;
  district?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  dealerName?: string | null;
  dealerStoreName?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  notes?: string | null;
}

export interface Type7bProductInput {
  id?: string;
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  quantityUsed?: number | null;
  unit?: string | null;
  notes?: string | null;
}

export interface Type7bDataInput {
  sourceActivityPlanId?: string | null;
  demoPlotId?: string | null;
  objective?: string | null;
  notes?: string | null;
  hasProducts?: boolean;
  sprayRound?: number | null;
  daysSinceStart?: number | null;
  plots?: Type7bPlotInput[];
  products?: Type7bProductInput[];
}

export interface Type7bTargetItem {
  id?: string;
  plotName?: string;
  plotCode?: string;
  owner?: string;
  farmerName?: string;
  ownerName?: string;
  dealerName?: string;
  dealerCode?: string;
  province?: string;
  district?: string;
  cropCategory?: string;
  crop?: string;
  cropName?: string;
  areaRai?: number | string | null;
  treeCount?: number | string | null;
  plots?: string;
  objective?: string;
  followUpObjective?: string;
  t7bObjective?: string;
  detail?: string;
  demoProducts?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  withdrawnProducts?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  items?: any[];
  activityType?: string;
  product?: string;
  productId?: string;
  plannedProductId?: string;
  demoProductQuantity?: string | number | null;
  targetCondition?: string;
  experimentDetail?: string;
  [key: string]: any;
}

export interface Type7bActualRecord {
  t7DaysAfterSpray?: string | number;
  t7SprayEquipment?: string;
  t7OtherEquipment?: string;
  t7NextSprayDate?: string;
  t7NextFollowUpDate?: string;
  t7StartDate?: string;
  actualStartDate?: string;
  t7SprayMethod?: string;
  t7HasExternalChemicals?: boolean;
  t7ExternalProducts?: any[];
  t7bSprayingRounds?: any[];
  t7ProductRates?: any[];
  t7FinalYieldKg?: string;
  t7ControlYieldKg?: string;
  t7YieldIncreasePercent?: string;
  t7FarmerSatisfaction?: number;
  t7CommercialPotential?: string;
  t7FinalSummaryNotes?: string;
  t7CropImages?: any[];
  t7PlotImages?: any[];
  [key: string]: any;
}

export type Type7bPlanItem = Type7bTargetItem;
