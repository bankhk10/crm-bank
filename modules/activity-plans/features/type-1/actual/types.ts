import type {
  ProductOption,
  Type1AdviceProductItem,
  Type1ImageFile,
} from "../shared/types";
import type { Type1PlannedItem } from "../planned/types";

/**
 * Data structure for recording actual outcome of a planned Type 1 visit
 */
export interface Type1ActualOutcome {
  targetId?: string;
  discussionResult: string;
  productAdvice?: string;
  advisedProducts?: Type1AdviceProductItem[];
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  nextAction?: string;
  nextMeetingDate?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string;
  plotLongitude?: string;
  plotImages?: Type1ImageFile[];
}

/**
 * Props for Type 1 Actual Form component
 */
export interface Type1ActualFormProps {
  isVisible: boolean;
  plannedTargets?: Type1PlannedItem[];
  actualOutcome: Type1ActualOutcome;
  onUpdateActualOutcome: (field: keyof Type1ActualOutcome, val: any) => void;
  products?: ProductOption[];
  readonly?: boolean;
}

export type ActualType1VisitProps = Type1ActualFormProps;

