import type { Type13PlotItem } from "../shared/types";

export interface Type13ApprovalProps {
  plots: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}
