import type { ImageFile, Type7bProductOption } from "../../shared/types";
import type { Type7bTargetItem, Type7bPlanCardTarget } from "./planned.types";

/**
 * 1.1 Baseline Products from Plan
 */
export interface Type7bBaselineProductItem {
  productId: string;
  productName: string;
  withdrawnQuantity?: number | string;
  plannedQuantity?: number | string;
  actualQuantity?: number | string;
  quantityUsed?: number | string;
  extraQuantity?: number | string;
  extraUnit?: string;
  applicationRate?: string;
  plannedRate?: string;
  actualRate?: string;
  unit?: string;
  detail?: string;
}

/**
 * 1.2 Additional Products added on-site
 */
export interface Type7bAdditionalProductItem {
  id: string;
  productId: string;
  productName?: string;
  actualQuantity?: number | string;
  quantityUsed?: number | string;
  extraQuantity?: number | string;
  extraUnit?: string;
  applicationRate?: string;
  actualRate?: string;
  unit?: string;
  detail?: string;
}

/**
 * Section 2: Single Spraying Round State
 */
export interface Type7bSprayRoundState {
  id: string;
  roundNumber: number;
  sprayDate?: string;
  sprayMethod: "SINGLE" | "TANK_MIXED" | string;
  sprayEquipment: string;
  otherEquipment?: string;
  productResponse: string;
  problemDetail?: string;
  baselineProducts: Type7bBaselineProductItem[];
  additionalProducts: Type7bAdditionalProductItem[];
  roundImages: ImageFile[];
}

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
  // Section 1: ข้อมูลการติดตามแปลง (Tracking Details)
  t7VisitDate?: string;
  t7DaysAfterSpray?: string | number;
  t7CropImages?: ImageFile[];

  // Section 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds)
  t7SprayingRounds?: Type7bSprayRoundState[];
  t7NextSprayDate?: string;
  t7Notes?: string;

  // Section 3: สถานะแปลงสาธิต
  t7PlotStatus?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | string;

  // Plot Context
  t7DemoPlotId?: string;
  t7PlotName?: string;
  t7FarmerName?: string;
  t7CropName?: string;

  // Backward-compatible fields
  t7SprayEquipment?: string;
  t7OtherEquipment?: string;
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
  t7ProductRates?: Type7bProductRateItem[];
  t7FinalYieldKg?: string;
  t7ControlYieldKg?: string;
  t7YieldIncreasePercent?: string;
  t7FarmerSatisfaction?: number;
  t7CommercialPotential?: string;
  t7FinalSummaryNotes?: string;
  t7PlotImages?: ImageFile[];
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

  // Dedicated helper callbacks from useType7bActual
  onAddRound?: () => void;
  onRemoveRound?: (roundIndex: number) => void;
  onUpdateRoundField?: (roundIndex: number, field: string, value: any) => void;
  onAddAdditionalProduct?: (roundIndex: number) => void;
  onUpdateAdditionalProduct?: (roundIndex: number, productIndex: number, field: string, value: any) => void;
  onRemoveAdditionalProduct?: (roundIndex: number, productIndex: number) => void;
  onUpdateBaselineProduct?: (roundIndex: number, productIndex: number, field: string, value: any) => void;
  onUpdateRoundImages?: (roundIndex: number, images: ImageFile[]) => void;
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
