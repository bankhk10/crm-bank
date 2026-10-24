import type { Type5ImageFile } from "../../shared/types";
import type { Type5TargetItem } from "./planned.types";

export interface Type5SurveyRecord {
  id?: string;
  targetId?: string;
  storeId?: string;
  store: string;
  productId?: string;
  product: string;
  detail?: string;
  competitorBrand: string;
  competitorProduct: string;
  posPrice?: string | number | null;
  dealerPrice?: string | number | null;
  subdealerPrice?: string | number | null;
  farmerPrice?: string | number | null;
  sellingPoints?: string;
  bottleImages?: Type5ImageFile[];
  promotionalImages?: Type5ImageFile[];
  competitorPrice?: string;
  competitorUnit?: string;
  promotionDetail?: string;
  [key: string]: any;
}

export interface Type5ActualFormProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  onUpdateSurveyItem?: (
    index: number,
    updated: Partial<Type5SurveyRecord>,
  ) => void;
  // Single-item fallback props
  competitorBrand?: string;
  setCompetitorBrand?: (v: string) => void;
  competitorProduct?: string;
  setCompetitorProduct?: (v: string) => void;
}

export interface Type5DetailViewProps {
  isVisible: boolean;
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

export interface Type5ApprovalCardProps {
  isVisible: boolean;
  target?: any;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

// Backward-compatible aliases
export type ActualType5SurveyProps = Type5ActualFormProps;
export type DetailType5SurveyProps = Type5DetailViewProps;
export type ApprovalType5SurveyProps = Type5ApprovalCardProps;
