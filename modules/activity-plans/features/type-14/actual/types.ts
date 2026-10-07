import type { ProductOption } from "../shared/types";
import type { useType14ActualState } from "./use-type14-actual-state";

export interface Type14ActualProductState {
  productId: string;
  productName: string;
  unit: string;
  quantityUsed: number | string;
  actualRate: string;
  detail: string;
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
  products: Type14ActualProductState[];
}

export interface Type14ActualProps {
  isVisible?: boolean;
  actualState: ReturnType<typeof useType14ActualState>;
  products?: ProductOption[];
  readonly?: boolean;
  plan?: any;
}
