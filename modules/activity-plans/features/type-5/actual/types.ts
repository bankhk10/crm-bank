import type {
  TargetSurveyItem,
  Type5SurveyRecord,
  Type5TargetItem,
} from "../types";

export type { TargetSurveyItem, Type5SurveyRecord, Type5TargetItem };

export interface ActualType5SurveyProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
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
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

export interface ApprovalType5SurveyProps {
  isVisible: boolean;
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}
