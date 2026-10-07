import type { ImageFile } from "../../shared/actual-view/types";
import type { Type13SprayingRound, ProductOption } from "../shared/types";
import type { useType13ActualState } from "./use-type13-actual-state";

export interface Type13ActualProductState {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string | null;
  drugWithdrawalItemId?: string | null;
  withdrawnQuantity?: number | null;
  detail?: string | null;
  isAdditional?: boolean;
}

export interface Type13PlotActualState {
  clientPlotId?: string;
  demoPlotId?: string | null;
  plotName: string;
  storeId?: string;
  dealerName?: string;
  province?: string;
  district?: string;
  latitude: string;
  longitude: string;
  isNew?: boolean;
  withdrawalProducts?: Array<{
    drugWithdrawalItemId: string;
    productId: string;
    productName: string;
    withdrawnQuantity: number;
    unit: string;
  }>;
  afterSprayImages?: ImageFile[];
  sprayRounds: Array<
    Omit<Type13SprayingRound, "products" | "demoPlotId"> & {
      demoPlotId?: string | null;
      clientPlotId?: string | null;
      products: Type13ActualProductState[];
    }
  >;
}

export interface Type13ActualProps {
  isVisible?: boolean;
  actualState: ReturnType<typeof useType13ActualState>;
  products: ProductOption[];
  dealers?: any[];
  readonly?: boolean;
}
