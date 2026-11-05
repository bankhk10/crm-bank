import type {
  Type13PlotItem,
  Type13WithdrawnProductLine,
  DealerOption,
  ProductOption,
  Type13PlotProduct,
} from "../../shared/types";

export type { DealerOption, ProductOption };

export type { Type13TargetItem } from "../../shared/types";
export type Type13PlanTarget = Type13PlotItem;

export interface Type13PlanStorePayload {
  workTypeCode: string;
  visitPurpose?: "FARMER" | "STORE" | null;
  storeId: string;
  storeName: string;
  province: string | null;
  remarks: string;
  notes: string;
}

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
