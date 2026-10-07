import type {
  Type13PlotItem,
  Type13WithdrawnProductLine,
  DealerOption,
  ProductOption,
} from "../shared/types";

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
