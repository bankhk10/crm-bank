import type {
  ActualTargetsState,
  ImageFile,
  Type7bProductRateItem,
} from "@/modules/activity-plans/features/shared/actual-view/types";

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
  target?: {
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
    demoProducts?: Array<{
      productId?: string;
      productName: string;
      quantity?: number;
      targetQuantity?: number;
      unit?: string;
    }>;
  };
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

export interface DetailType7FollowUpProps {
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    followUpObjective?: string;
    items?: any[];
  };
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
  demoResults?: any[];
  externalProducts?: any[];
  sprayRounds?: any[];
}

export interface ApprovalType7bDemoProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
}

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
