import type {
  Type14PlotItem,
  Type14TargetItem,
  Type14PlotActualState,
  Type14SprayRoundState,
  Type14ActualProductState,
  ProductOption,
  FollowUpPlotOption,
} from "../../shared/types";
import type { Type14PlanInput } from "./planned.types";

export type { Type14PlotActualState, Type14ActualProductState };

export type Type14ActualProduct = Type14ActualProductState;

export interface Type14ActualProps {
  isVisible?: boolean;
  actualState: any;
  products?: ProductOption[];
  dealers?: any[];
  readonly?: boolean;
  className?: string;
  targets?: Type14TargetItem[];
  target?: Type14TargetItem;
  plan?: any;
}

export type Type14ActualFormProps = Type14ActualProps;

export interface Type14DetailData {
  demoPlotId?: string | null;
  plotName?: string | null;
  rounds?: Type14SprayRoundState[];
  sprayRounds?: Type14SprayRoundState[];
  plots?: Type14PlotActualState[] | Type14PlotItem[];
  attachments?: Array<{
    id?: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    category?: string;
    targetId?: string | null;
    type14ResultId?: string | null;
  }>;
}

export interface Type14DetailProps {
  isVisible?: boolean;
  data?: Type14PlanInput;
  plots?: any[];
  actualData?: Type14DetailData | any;
  planSummary?: {
    province?: string | null;
    district?: string | null;
    [key: string]: any;
  };
  plan?: any;
  className?: string;
}

export type Type14DetailViewProps = Type14DetailProps;

export interface Type14ApprovalProps {
  isVisible?: boolean;
  data?: Type14PlanInput;
  plots?: any[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
    [key: string]: any;
  };
  className?: string;
}

export type Type14ApprovalCardProps = Type14ApprovalProps;
