import type { ProductOption } from "../shared/types";
import type { useType14ActualState } from "./use-type14-actual-state";

export interface Type14ActualProductState {
  productId: string;
  productName: string;
  unit: string;
  withdrawnQuantity?: number;
  quantityUsed: number | string;
  actualRate: string;
  detail: string;
  drugWithdrawalItemId?: string | null;
  supplementalDrugWithdrawalItemId?: string | null;
  sourceGroup: "ORIGINAL" | "SUPPLEMENTAL" | "ACTUAL_ONLY";
  supplementalStatus?: string;
  supplementalWithdrawalId?: string;
  sortOrder?: number;
}

export interface Type14ImageState {
  id: string;
  url: string;
  file?: File;
  name?: string;
  size?: number;
  type?: string;
}

export interface Type14SprayRoundState {
  id?: string;
  roundNumber: number; // 1, 2, 3...
  actualVisitDate: string;
  daysAfterSpray: string;
  trackingResult: string;
  additionalNotes: string;
  afterSprayImages: Type14ImageState[];
  originalProducts: Type14ActualProductState[]; // Group A per round
  supplementalProducts: Type14ActualProductState[]; // Group B per round
  actualOnlyProducts: Type14ActualProductState[]; // Group C per round
}

export interface Type14ActualProps {
  isVisible?: boolean;
  actualState: ReturnType<typeof useType14ActualState>;
  products?: ProductOption[];
  readonly?: boolean;
  plan?: any;
}
