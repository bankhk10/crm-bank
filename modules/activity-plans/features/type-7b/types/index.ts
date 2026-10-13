import type { ProductOption, Type7DemoProductLine } from "@/modules/activity-plans/features/type-7a/types";
import type { UserDemoPlotOption, FollowUpPlanOption } from "@/modules/activity-plans/constants";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";
import type {
  ActualTargetsState,
  ImageFile,
  Type7bProductRateItem,
  Type7bSprayingRoundItem,
} from "@/modules/activity-plans/features/shared/actual-view/types";

export type { ProductOption, UserDemoPlotOption, Type7DemoProductLine, Type7DemoPlotItem, FollowUpPlanOption };

export type EditProductOption = ProductOption;

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
  storeId?: string | null;
  dealerName?: string | null;
  farmerName?: string | null;
  farmerPhone?: string | null;
  province?: string | null;
  district?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  sprayRound?: number | null;
  sprayDate?: Date | string | null;
  daysSinceStart?: number | null;
  cropAgeValue?: number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  sprayMethod?: string | null;
  sprayEquipment?: string | null;
  otherEquipment?: string | null;
  notes?: string | null;
  objective?: string | null;
  hasProducts?: boolean;
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

// Plan Card Types
export interface Type7bPlanTarget {
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
    product?: { name?: string; unit?: string | null };
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  withdrawnProducts?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    product?: { name?: string; unit?: string | null };
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  items?: any[];
  [key: string]: any;
}

export interface Type7bPlanCardProps {
  target?: Type7bPlanTarget;
  planType?: string;
  className?: string;
}

// Plan Form Types
export interface Type7FollowUpProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  existingPlotOptions: Array<{
    value: string;
    label: string;
    subLabel?: string;
  }>;
  plotList: UserDemoPlotOption[];
  followUpPlans?: FollowUpPlanOption[];
  products?: ProductOption[];
  readonly?: boolean;
}

export type Type7bPlanFormProps = Type7FollowUpProps;

// Validation Types
export interface ValidateType7bOptions {
  items?: Type7DemoPlotItem[];
  selectedWorkTypes?: string[];
}

export interface Type7bValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Type7bActualValidationInput {
  activityResultStatus?: string;
  t7PlannedProductId?: string | null;
  t7ActualProductId?: string | null;
  t7ChangeReason?: string;
  actualStartDate?: string;
  t7DaysAfterSpray?: number | string;
  t7CropImages?: ImageFile[];
  t7bSprayingRounds?: Type7bSprayingRoundItem[];
  t7PlotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "";
  t7FinalSummaryNotes?: string;
}

// Actual & History Types
export interface DemoPlotVisitHistoryItem {
  id: string;
  visitNumber: number;
  visitDate: string;
  daysAfterSpray?: number | null;
  cropAgeValue?: string | number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  cropProblemDescription?: string | null;
  productResponse?: string | null;
  problemDescription?: string | null;
  sprayEquipment?: string | null;
  sprayMethod?: string | null;
  plotStatus?: string | null;
  nextFollowUpDate?: string | null;
  nextSprayDate?: string | null;
  finalYieldKg?: number | string | null;
  controlYieldKg?: number | string | null;
  yieldIncreasePercent?: number | string | null;
  farmerSatisfaction?: number | null;
  commercialPotential?: string | null;
  finalSummaryNotes?: string | null;
  productRates?: Type7bProductRateItem[];
  plotImages?: ImageFile[];
  cropImages?: ImageFile[];
  createdByName?: string | null;
  activityPlanCode?: string | null;
}

export interface ActualType7FollowUpProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type7bTargetItem;
  targets?: Type7bTargetItem[];
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  }>;
  demoPlotData?: any;
  demoPlotId?: string | null;
  visitHistory?: any[];
  startDate?: string;
  plotName?: string;
  usageMethod?: string;
  setUsageMethod?: (v: string) => void;
  actualStartDate?: string;
  setActualStartDate?: (v: string) => void;

  // Form Fields
  daysAfterSpray?: string | number;
  setDaysAfterSpray?: (v: any) => void;
  productRates?: any[];
  setProductRates?: (v: any[]) => void;
  bProductRates?: any[];
  setBProductRates?: (v: any[]) => void;
  sprayEquipment?: string;
  setSprayEquipment?: (v: any) => void;
  otherEquipment?: string;
  setOtherEquipment?: (v: any) => void;
  t7bSprayingRounds?: any[];
  setT7bSprayingRounds?: (v: any[]) => void;
  nextSprayDate?: string;
  setNextSprayDate?: (v: any) => void;
  sprayMethod?: "SINGLE" | "TANK_MIXED" | string;
  setSprayMethod?: (v: any) => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: any) => void;
  externalProducts?: any[];
  setExternalProducts?: (v: any[]) => void;

  cropAgeValue?: string | number;
  setCropAgeValue?: (v: any) => void;
  cropAgeUnit?: string;
  setCropAgeUnit?: (v: any) => void;
  growthStage?: string;
  setGrowthStage?: (v: any) => void;
  cropCondition?: string;
  setCropCondition?: (v: any) => void;
  cropProblemDesc?: string;
  setCropProblemDesc?: (v: any) => void;
  cropProblemDescription?: string;
  setCropProblemDescription?: (v: any) => void;
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  problemDescription?: string;
  setProblemDescription?: (v: any) => void;

  plotStatus?: any;
  setPlotStatus?: (v: any) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: any) => void;

  finalYieldKg?: string | number;
  setFinalYieldKg?: (v: any) => void;
  controlYieldKg?: string | number;
  setControlYieldKg?: (v: any) => void;
  yieldIncreasePercent?: string | number;
  setYieldIncreasePercent?: (v: any) => void;
  farmerSatisfaction?: number;
  setFarmerSatisfaction?: (v: any) => void;
  commercialPotential?: string;
  setCommercialPotential?: (v: any) => void;
  finalSummaryNotes?: string;
  setFinalSummaryNotes?: (v: any) => void;

  plotImages?: any[];
  setPlotImages?: (v: any[]) => void;
  cropImages?: any[];
  setCropImages?: (v: any[]) => void;

  readonly?: boolean;
}

export type Type7bActualFormProps = ActualType7FollowUpProps;

// Detail View Props
export interface DetailType7FollowUpProps {
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner?: string;
    product?: string;
    crop?: string;
    plots?: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    followUpObjective?: string;
    items?: any[];
    [key: string]: any;
  };
  targets?: Type7bTargetItem[];
  plotName?: string;
  usageMethod?: string;
  cropAgeValue?: string;
  cropAgeUnit?: string;
  growthStage?: string;
  cropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  cropProblemDescription?: string;
  productResponse?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDescription?: string;
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  nextFollowUpDate?: string;
  finalYieldKg?: string;
  controlYieldKg?: string;
  yieldIncreasePercent?: string;
  farmerSatisfaction?: number;
  commercialPotential?: string;
  finalSummaryNotes?: string;
  plotImages?: ImageFile[];
  cropImages?: ImageFile[];
  demoPlotData?: any;
  demoPlotId?: string | null;
  daysAfterSpray?: string | number;
  productRates?: Type7bProductRateItem[];
  sprayEquipment?: string;
  otherEquipment?: string;
  nextSprayDate?: string;
  sprayMethod?: "SINGLE" | "TANK_MIXED" | string;
  visitHistory?: any[];
  visitDate?: string;
  actualStartDate?: string;
  startDate?: string;
  demoResults?: any[];
  externalProducts?: any[];
  sprayRounds?: any[];
}

export type Type7bDetailViewProps = DetailType7FollowUpProps;

// Approval Card Props
export interface ApprovalType7bDemoProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
  targets?: Type7bTargetItem[];
}

export type Type7bApprovalCardProps = ApprovalType7bDemoProps;

// History Modal Props
export interface DemoPlotHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: {
    id?: string;
    code?: string;
    name?: string;
    ownerName?: string;
    cropCategory?: string;
    cropName?: string;
    targetCrop?: string;
    primaryProductName?: string;
    productName?: string;
    showcase?: string;
    areaRai?: number | string | null;
    treeCount?: number | string | null;
    location?: string | null;
    startDate?: string | Date;
    plantingDate?: string | Date | null;
    plantingAreaCondition?: string | null;
    usageMethod?: string | null;
    objective?: string | null;
    experimentDetail?: string | null;
    status?: string;
    visitsCount?: number;
    daysSinceStart?: number;
    totalCost?: number;
    plotName?: string;
    customer?: any;
    dealerName?: string | null;
    province?: string | null;
    district?: string | null;
    [key: string]: any;
  };
  visits?: any[];
  isLoading?: boolean;
}

// Hook Types
export interface UseType7bFormOptions {
  initial?: any;
  initDetails?: any;
  initialTypes?: string[];
  fetchedFollowUpDemoPlots?: any[];
  fetchedFollowUpPlansWithPlots?: FollowUpPlanOption[];
  demoPlotsList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
  parentStartDate?: string;
}

export interface UseType7bFormResult {
  type7bItems: Type7DemoPlotItem[];
  setType7bItems: React.Dispatch<React.SetStateAction<Type7DemoPlotItem[]>>;
  followUpPlotsForType7B: any[];
  fetchedFollowUpPlansWithPlots: FollowUpPlanOption[];
  addType7bRow: () => void;
  updateType7bRow: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  deleteType7bRow: (id: string) => void;
  validateType7b: () => { isValid: boolean; error?: string };
  mapType7bPayload: (products: any[]) => {
    type7bData?: {
      sourceActivityPlanId?: string | null;
      demoPlotId?: string | null;
      objective?: string | null;
      notes?: string | null;
      hasProducts?: boolean;
      sprayRound?: number | null;
      daysSinceStart?: number | null;
      plots?: Type7bPlotInput[];
      products?: Type7bProductInput[];
    };
  };
}
