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
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
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

  // Form Fields
  daysAfterSpray: string | number;
  setDaysAfterSpray: (v: string | number) => void;
  productRates: Type7bProductRateItem[];
  setProductRates: (v: Type7bProductRateItem[]) => void;
  sprayEquipment: string;
  setSprayEquipment: (v: string) => void;
  otherEquipment: string;
  setOtherEquipment: (v: string) => void;
  nextSprayDate: string;
  setNextSprayDate: (v: string) => void;
  sprayMethod: "SINGLE" | "TANK_MIXED";
  setSprayMethod: (v: "SINGLE" | "TANK_MIXED") => void;

  cropAgeValue: string;
  setCropAgeValue: (v: string) => void;
  cropAgeUnit: string;
  setCropAgeUnit: (v: string) => void;
  growthStage: string;
  setGrowthStage: (v: string) => void;
  cropCondition: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  setCropCondition: (
    v: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "",
  ) => void;
  cropProblemDescription: string;
  setCropProblemDescription: (v: string) => void;
  productResponse: "พืชตอบสนองดี" | "พบปัญหา" | "";
  setProductResponse: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  problemDescription: string;
  setProblemDescription: (v: string) => void;

  plotStatus: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  setPlotStatus: (v: "IN_PROGRESS" | "COMPLETED" | "FAILED") => void;
  nextFollowUpDate: string;
  setNextFollowUpDate: (v: string) => void;

  finalYieldKg: string;
  setFinalYieldKg: (v: string) => void;
  controlYieldKg: string;
  setControlYieldKg: (v: string) => void;
  yieldIncreasePercent: string;
  setYieldIncreasePercent: (v: string) => void;
  farmerSatisfaction: number;
  setFarmerSatisfaction: (v: number) => void;
  commercialPotential: string;
  setCommercialPotential: (v: string) => void;
  finalSummaryNotes: string;
  setFinalSummaryNotes: (v: string) => void;

  plotImages: ImageFile[];
  setPlotImages: (v: ImageFile[]) => void;
  cropImages: ImageFile[];
  setCropImages: (v: ImageFile[]) => void;

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
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  visitHistory?: any[];
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
