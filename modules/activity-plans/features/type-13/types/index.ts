import type { ImageFile } from "../../shared/actual-view/types";

export const TYPE13_MAX_IMAGES_PER_VILLAGE = 20;

// ==========================================
// Domain & Plot Models
// ==========================================

export interface Type13PlotProduct {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface Type13WithdrawnProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface Type13PlotItem {
  id: string;
  demoPlotId?: string | null;
  name: string;
  storeId: string;
  dealerName?: string | null;
  ownerName?: string | null;
  province: string;
  district: string;
  subdistrict?: string | null;
  village?: string | null;
  plannedPlotsCount?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  products?: Type13PlotProduct[];
}

export interface Type13ExternalProduct {
  company: string;
  productName: string;
  activeIngredient?: string | null;
  formula: string;
  customFormula?: string | null;
  applicationRate: string;
}

export interface Type13SprayingProduct {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string | null;
  detail?: string | null;
}

export interface Type13SprayingRoundAttachment {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Type13SprayingRound {
  id?: string;
  demoPlotId?: string | null;
  clientPlotId?: string | null;
  roundNumber: number;
  sprayDate: string;
  sprayMethod: "SINGLE" | "TANK_MIXED";
  sprayEquipment: string;
  otherEquipment?: string | null;
  productResponse: string;
  problemDetail?: string | null;
  workTypeCode?: string;
  products: Type13SprayingProduct[];
  externalProducts?: Type13ExternalProduct[];
  attachments?: Type13SprayingRoundAttachment[];
}

export interface DealerOption {
  id: string;
  name: string;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
  price?: number | null;
  categoryId?: string | null;
}

export interface Type13PlanStorePayload {
  workTypeCode: string;
  visitPurpose?: "FARMER" | "STORE" | null;
  storeId: string;
  storeName: string;
  province: string | null;
  remarks: string;
  notes: string;
}

export interface Type13ActualProductState {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string | null;
  detail?: string | null;
}

export interface Type13PlotActualState {
  clientPlotId?: string;
  demoPlotId?: string | null;
  plotName: string;
  storeId?: string;
  dealerName?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  village?: string;
  plannedPlotsCount?: number | string;
  actualPlotsCount?: number | string;
  applicationRate?: string;
  latitude: string;
  longitude: string;
  isNew?: boolean;
  afterSprayImages?: ImageFile[];
  sprayRounds: Array<
    Omit<Type13SprayingRound, "products" | "demoPlotId"> & {
      demoPlotId?: string | null;
      clientPlotId?: string | null;
      products: Type13ActualProductState[];
    }
  >;
}

export interface Type13TargetItem {
  id?: string;
  demoPlotId?: string | null;
  name?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  village?: string | null;
  plannedPlotsCount?: number | null;
  actualPlotsCount?: number | null;
  applicationRate?: string | null;
  products?: Type13PlotProduct[];
}

export type Type13PlanTarget = Type13TargetItem;

// ==========================================
// Component Props
// ==========================================

export interface Type13PlanCardProps {
  plots?: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  planType?: string;
  className?: string;
}

export interface Type13CreateProps {
  plots: Type13PlotItem[];
  onChange: (plots: Type13PlotItem[]) => void;
  dealers: DealerOption[];
  products: ProductOption[];
  readonly?: boolean;
  hasProductWithdrawal?: boolean;
  onToggleWithdrawal?: (checked: boolean) => void;
  withdrawnProducts?: Type13WithdrawnProductLine[];
  onWithdrawnProductsChange?: (products: Type13WithdrawnProductLine[]) => void;
}

export type Type13EditProps = Type13CreateProps;
export type Type13PlanFormProps = Type13CreateProps;

import type { useType13ActualState } from "../hooks/use-type13-actual-state";

export type UseType13ActualStateResult = ReturnType<typeof useType13ActualState>;

export interface Type13ActualProps {
  isVisible?: boolean;
  actualState: UseType13ActualStateResult;
  products: ProductOption[];
  dealers?: any[];
  readonly?: boolean;
}

export type Type13ActualFormProps = Type13ActualProps;

export interface Type13DetailActualProduct {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: any;
  unit?: string | null;
  detail?: string | null;
}

export interface Type13DetailExternalProduct {
  company: string;
  productName: string;
  activeIngredient?: string | null;
  formula: string;
  customFormula?: string | null;
  applicationRate: string;
}

export interface Type13DetailSprayRound {
  demoPlotId: string;
  roundNumber: number;
  sprayDate: any;
  sprayMethod: string;
  sprayEquipment: string;
  otherEquipment?: string | null;
  productResponse: string;
  problemDetail?: string | null;
  products: Type13DetailActualProduct[];
  externalProducts?: Type13DetailExternalProduct[];
  attachments?: Array<{
    fileUrl: string;
    fileName?: string;
  }>;
}

export interface Type13DetailData {
  type13PlotsActual?: Array<{ demoPlotId: string; latitude: any; longitude: any }>;
  sprayRounds?: Type13DetailSprayRound[];
  attachments?: Array<{
    demoPlotId?: string | null;
    sprayRoundId?: string | null;
    fileUrl: string;
    fileName?: string;
  }>;
}

export interface Type13DetailProps {
  isVisible?: boolean;
  plots?: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  actualData?: Type13DetailData;
}

export type DetailType13AttackProps = Type13DetailProps;
export type Type13DetailViewProps = Type13DetailProps;

export interface Type13ApprovalProps {
  isVisible?: boolean;
  plots?: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}

export type Type13ApprovalCardProps = Type13ApprovalProps;

// ==========================================
// Validation Types
// ==========================================

export interface ValidateType13Params {
  selectedWorkTypes: string[];
  type13Plots: Type13PlotItem[];
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type13WithdrawnProductLine[];
}

export type ValidateType13Options = ValidateType13Params;

export interface Type13ValidationResult {
  isValid: boolean;
  error?: string;
}
