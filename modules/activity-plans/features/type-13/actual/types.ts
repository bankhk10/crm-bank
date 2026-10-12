import type { ProductOption } from "../types";
import type { useType13ActualState } from "./use-type13-actual-state";

export type {
  Type13ActualProductState,
  Type13PlotActualState,
} from "../types";

export interface Type13ActualProps {
  isVisible?: boolean;
  actualState: ReturnType<typeof useType13ActualState>;
  products: ProductOption[];
  dealers?: any[];
  readonly?: boolean;
}
