import type {
  Type7bDemoPlotOption,
  Type7bProductOption,
  Type7bWithdrawnProductLine,
  Type7bImageFile,
  Type7bFollowUpPlanOption,
} from "../../shared/types";

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

  // On-the-spot Follow-up Evaluation
  cropCondition: string;
  growthStage: string;
  productResponse?: string;
  cropProblemDescription?: string;
  sprayMethod?: string;
  sprayEquipment?: string;
  nextSprayDate?: string;
  notes?: string;
  objective?: string;

  // Products
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type7bWithdrawnProductLine[];

  // Photos
  photos?: Type7bImageFile[];

  // Final evaluation if completed
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  finalYieldKg?: string;
  controlYieldKg?: string;
  farmerSatisfaction?: number;
  commercialPotential?: string;
  finalSummaryNotes?: string;
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
  addWithdrawnProduct?: (itemId: string) => void;
  updateWithdrawnProduct?: (
    itemId: string,
    prodId: string,
    field: keyof Type7bWithdrawnProductLine,
    val: any,
  ) => void;
  deleteWithdrawnProduct?: (itemId: string, prodId: string) => void;
}
