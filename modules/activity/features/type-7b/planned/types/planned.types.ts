import type {
  Type7bWithdrawnProductLine,
  Type7bFollowUpPlanOption,
  Type7bDemoPlotOption,
  Type7bProductOption,
} from "../../shared/types";

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
  withdrawnProducts?: Array<Type7bWithdrawnProductLine>;
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

export interface Type7bPlanItem {
  id: string;
  plotActivityType?: string;
  selectedPlanId?: string;
  selectedPlotIds?: string[];
  demoPlotId?: string;
  existingPlotId?: string;
  existingPlotName?: string;
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type7bWithdrawnProductLine[];
  plotName?: string;
  storeId?: string;
  ownerName?: string;
  farmerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  areaRai?: number | null;
  treeCount?: number | null;
  province?: string;
  district?: string;
  categoryId?: string;
  chemicalGroupId?: string;
  objective?: string;
  detail?: string;
  productId?: string;
  productName?: string;
  demoProducts?: any[];
  startDate?: string;
  notes?: string;
  sprayingRoundNumber?: number;
  [key: string]: any;
}

export interface Type7bPlanCardTarget {
  detail?: string;
  t7bObjective?: string;
  followUpObjective?: string;
  objective?: string;
  plotName?: string;
  owner?: string;
  crop?: string;
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
  [key: string]: any;
}

export interface Type7bPlanCardProps {
  target?: Type7bPlanCardTarget;
  targets?: Type7bPlanCardTarget[];
  planType?: string;
  className?: string;
}

export interface Type7bPlannedFormProps {
  item: Type7bPlanItem;
  updateType7Row: (id: string, field: keyof Type7bPlanItem | string, val: any) => void;
  plotList?: Type7bDemoPlotOption[];
  followUpPlans?: Type7bFollowUpPlanOption[];
  products?: Type7bProductOption[];
  readonly?: boolean;
}

export type Type7bPlanFormProps = Type7bPlannedFormProps;
export type Type7FollowUpProps = Type7bPlannedFormProps;

export interface ValidateType7bOptions {
  requirePlots?: boolean;
}

export interface Type7bValidationResult {
  isValid: boolean;
  error?: string;
}
