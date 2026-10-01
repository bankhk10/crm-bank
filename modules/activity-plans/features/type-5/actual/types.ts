import type {
  ActualTargetsState,
  Type5SurveyRecord,
} from "@/modules/activity-plans/features/shared/actual-view/types";

export interface TargetSurveyItem {
  id?: string;
  store: string;
  product: string;
  detail: string;
}

export interface ActualType5SurveyProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target: {
    store: string;
    product: string;
    detail: string;
    items?: Array<{
      id?: string;
      store?: string;
      product?: string;
      detail?: string;
    }>;
  };
  surveyDetails?: Type5SurveyRecord[];
  onUpdateSurveyItem?: (
    index: number,
    updated: Partial<Type5SurveyRecord>,
  ) => void;
  // Fallback single-item props
  competitorBrand?: string;
  setCompetitorBrand?: (v: string) => void;
  competitorProduct?: string;
  setCompetitorProduct?: (v: string) => void;
}

export interface DetailType5SurveyProps {
  isVisible: boolean;
  target: {
    store: string;
    product: string;
    detail: string;
    items?: TargetSurveyItem[];
  };
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

export interface ApprovalType5SurveyProps {
  isVisible: boolean;
  target: ActualTargetsState["t5"];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}
