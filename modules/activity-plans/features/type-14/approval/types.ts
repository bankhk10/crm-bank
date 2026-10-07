import type { Type14PlanInput } from "../shared/types";

export interface Type14ApprovalProps {
  data: Type14PlanInput;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}
