import type { TourType, TourSize, Type12ImageFile } from "../../shared/types";
import type { Type12TargetItem } from "./planned.types";

export interface Type12ActualRecord {
  actualAttendees?: number | string;
  tourHighlights?: string;
  feedbackIssues?: string;
  images?: Type12ImageFile[];
}

export interface Type12ActualFormProps {
  isVisible?: boolean;
  planType?: string | null;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  actualAttendees?: string | number;
  setActualAttendees?: (val: string) => void;
  tourHighlights?: string;
  setTourHighlights?: (val: string) => void;
  feedbackIssues?: string;
  setFeedbackIssues?: (val: string) => void;
  images?: Type12ImageFile[];
  setImages?: (imgs: Type12ImageFile[]) => void;
  onUploadImages?: (files: File[]) => Promise<Type12ImageFile[]>;
  readonly?: boolean;
  className?: string;
  [key: string]: any;
}

export interface Type12DetailViewProps {
  isVisible?: boolean;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  tourType?: TourType | string | null;
  tourSize?: TourSize | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
  actualAttendees?: string | number;
  tourHighlights?: string;
  feedbackIssues?: string;
  images?: Type12ImageFile[];
  effectiveT12Images?: Type12ImageFile[];
  className?: string;
  [key: string]: any;
}

export type DetailType12TourProps = Type12DetailViewProps;

export interface Type12ApprovalCardProps {
  isVisible?: boolean;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  tourType?: TourType | string | null;
  tourSize?: TourSize | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
  actualAttendees?: string | number;
  tourHighlights?: string;
  feedbackIssues?: string;
  images?: Type12ImageFile[];
  effectiveT12Images?: Type12ImageFile[];
  className?: string;
  [key: string]: any;
}

export type ApprovalType12TourProps = Type12ApprovalCardProps;
