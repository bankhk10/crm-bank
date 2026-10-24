import type {
  Type7bDemoPlotOption,
  Type7bProductOption,
  Type7bWithdrawnProductLine,
  Type7bImageFile,
  Type7bFollowUpPlanOption,
} from "../../shared/types";
import type {
  Type7bSprayRoundState,
  Type7bBaselineProductItem,
  Type7bAdditionalProductItem,
  Type7bExternalChemicalItem,
} from "../../planned/types/actual.types";

export type {
  Type7bSprayRoundState,
  Type7bBaselineProductItem,
  Type7bAdditionalProductItem,
  Type7bExternalChemicalItem,
};

export interface Type7bUnplannedItem {
  id: string;
  demoPlotId?: string | null;
  sourceActivityPlanId?: string | null;

  // Plot Details
  plotName: string;
  farmerName: string;
  province?: string;
  district?: string;
  cropCategory?: string;
  cropName: string;
  areaRai?: number | null;
  treeCount?: number | null;
  dealerName?: string;

  // Section 1: ข้อมูลการติดตามแปลง (Tracking Details)
  visitDate?: string;
  daysAfterSpray?: number | string | null;
  cropImages?: Type7bImageFile[];

  // Section 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds)
  sprayingRounds: Type7bSprayRoundState[];
  nextSprayDate?: string;
  notes?: string;

  // Section 3: สถานะแปลงสาธิตและการปิดแปลง
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | string;
  finalYieldKg?: string;
  controlYieldKg?: string;
  farmerSatisfaction?: number;
  commercialPotential?: string;
  finalSummaryNotes?: string;
  finalHarvestDate?: string;

  // Backward compatibility / optional legacy fields
  cropCondition?: string;
  growthStage?: string;
  productResponse?: string;
  cropProblemDescription?: string;
  sprayMethod?: string;
  sprayEquipment?: string;
  objective?: string;
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type7bWithdrawnProductLine[];
  photos?: Type7bImageFile[];
}

export interface Type7bUnplannedValidationResult {
  isValid: boolean;
  errors?: string[];
  error?: string;
}

export interface Type7bUnplannedFormProps {
  readonly?: boolean;
  items: Type7bUnplannedItem[];
  plotList?: Type7bDemoPlotOption[];
  followUpPlans?: Type7bFollowUpPlanOption[];
  products?: Type7bProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type7bUnplannedItem | string, val: any) => void;
  deleteItem?: (id: string) => void;

  // Round Action Handlers
  onAddRound?: (itemId: string) => void;
  onRemoveRound?: (itemId: string, roundIndex: number) => void;
  onUpdateRoundField?: (itemId: string, roundIndex: number, field: string, value: any) => void;

  // Products Used in Round Handlers
  onAddProduct?: (itemId: string, roundIndex: number) => void;
  onUpdateProduct?: (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
    field: string,
    value: any,
  ) => void;
  onRemoveProduct?: (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
  ) => void;
  onAddAdditionalProduct?: (itemId: string, roundIndex: number) => void;
  onUpdateAdditionalProduct?: (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
    field: string,
    value: any,
  ) => void;
  onRemoveAdditionalProduct?: (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
  ) => void;
  onAddBaselineProduct?: (itemId: string, roundIndex: number) => void;
  onUpdateBaselineProduct?: (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
    field: string,
    value: any,
  ) => void;
  onRemoveBaselineProduct?: (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
  ) => void;

  // Tank-mix & Round Images Handlers
  onAddExternalProduct?: (itemId: string, roundIndex: number) => void;
  onUpdateExternalProduct?: (
    itemId: string,
    roundIndex: number,
    extIndex: number,
    field: string,
    value: any,
  ) => void;
  onRemoveExternalProduct?: (
    itemId: string,
    roundIndex: number,
    extIndex: number,
  ) => void;
  onUpdateRoundImages?: (itemId: string, roundIndex: number, images: any[]) => void;

  // Legacy product handlers for backward compatibility
  addWithdrawnProduct?: (itemId: string) => void;
  updateWithdrawnProduct?: (
    itemId: string,
    prodId: string,
    field: keyof Type7bWithdrawnProductLine,
    val: any,
    selectedProduct?: any,
  ) => void;
  deleteWithdrawnProduct?: (itemId: string, prodId: string) => void;
}
