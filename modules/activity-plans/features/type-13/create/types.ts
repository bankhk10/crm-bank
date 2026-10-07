import type {
  Type13PlotItem,
  DealerOption,
  ProductOption,
} from "../shared/types";

export interface Type13CreateProps {
  plots: Type13PlotItem[];
  onChange: (plots: Type13PlotItem[]) => void;
  dealers: DealerOption[];
  products: ProductOption[];
  readonly?: boolean;
}
