import type { ImageFile, Type7bProductOption } from "../../shared/types";
import type { Type7bTargetItem, Type7bPlanCardTarget } from "./planned.types";

export interface Type7bProductRateItem {
  id: string;
  productId?: string;
  productName?: string;
  ratePerWater?: string;
  ratePerRai?: string;
  notes?: string;
}

export interface Type7bSprayingRoundItem {
  roundNumber: number;
  sprayDate: string;
  cropAgeValue?: string;
  cropAgeUnit?: string;
  growthStage?: string;
  cropCondition?: string;
  sprayMethod?: string;
  sprayEquipment?: string;
  notes?: string;
}

export interface DemoPlotVisitHistoryItem {
  id: string;
  visitNumber: number;
  visitDate: string;
  daysSinceStart?: number;
  cropCondition?: string;
  growthStage?: string;
  sprayMethod?: string;
  sprayEquipment?: string;
  notes?: string;
  farmerSatisfaction?: number;
  finalYieldKg?: number;
  controlYieldKg?: number;
  attachments?: Array<{ id: string; fileUrl: string; fileName: string }>;
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
  t7CropAgeValue?: string | number;
  t7CropAgeUnit?: string;
  t7GrowthStage?: string;
  t7CropCondition?: string;
  t7CropProblemDescription?: string;
  t7ProductResponse?: string;
  t7ProblemDescription?: string;
  t7HasExternalChemicals?: boolean;
  t7ExternalProducts?: any[];
  t7SprayingRounds?: Type7bSprayingRoundItem[];
  t7ProductRates?: Type7bProductRateItem[];
  t7FinalYieldKg?: string;
  t7ControlYieldKg?: string;
  t7YieldIncreasePercent?: string;
  t7FarmerSatisfaction?: number;
  t7CommercialPotential?: string;
  t7FinalSummaryNotes?: string;
  t7CropImages?: ImageFile[];
  t7PlotImages?: ImageFile[];
  t7PlotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  t7DemoPlotId?: string;
  t7PlotName?: string;
  t7FarmerName?: string;
  t7CropName?: string;
  t7DemoResults?: any[];
  [key: string]: any;
}

export interface Type7bActualFormProps {
  isVisible?: boolean;
  planType?: string;
  target?: Type7bTargetItem;
  targets?: Type7bTargetItem[];
  customers?: any[];
  products?: Type7bProductOption[];
  actualState?: Type7bActualRecord;
  onUpdateField?: (field: keyof Type7bActualRecord | string, value: any) => void;
  readonly?: boolean;
  demoPlotHistory?: DemoPlotVisitHistoryItem[];
}

export type ActualType7FollowUpProps = Type7bActualFormProps;

export interface Type7bDetailViewProps {
  isVisible?: boolean;
  target?: Type7bTargetItem;
  targets?: Type7bTargetItem[];
  actualResult?: Type7bActualRecord;
  attachments?: Array<{ id?: string; fileUrl?: string; fileName?: string; url?: string; name?: string }>;
}

export interface Type7bApprovalCardProps {
  isVisible?: boolean;
  plan?: any;
  target?: Type7bTargetItem;
  targets?: Type7bTargetItem[];
}
