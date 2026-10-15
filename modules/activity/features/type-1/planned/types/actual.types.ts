import type {
  ProductOption,
  Type1AdviceProductItem,
  Type1ImageFile,
} from "../../shared/types";
import type { Type1TargetItem } from "./planned.types";

/**
 * Structured actual recording item per target for TYPE 1 Multi-Target actual recording
 */
export interface Type1TargetActualItem {
  id: string;
  targetId?: string;
  storeId?: string;
  customer: string;
  visitPurpose?: "FARMER" | "STORE";
  topic?: string;
  detail?: string;
  province?: string;
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;

  // Actual recording fields
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
 * Props for Type 1 Actual Form component (Actual recording for planned activities)
 */
export interface Type1ActualFormProps {
  isVisible: boolean;
  actualState?: any;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  planType?: "PLANNED" | "UNPLANNED" | string;
  productAdvice?: string;
  setProductAdvice?: (v: string) => void;
  advisedProducts?: Type1AdviceProductItem[];
  setAdvisedProducts?: (products: Type1AdviceProductItem[]) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  discussionResult?: string;
  setDiscussionResult?: (v: string) => void;
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  setSalesOpportunity?: (v: "สูง" | "ต่ำ" | "") => void;
  nextAction?: string;
  setNextAction?: (v: string) => void;
  nextMeetingDate?: string;
  setNextMeetingDate?: (v: string) => void;
  products?: ProductOption[];

  // Actual TYPE_1 fields
  farmerHomeAddress?: string;
  setFarmerHomeAddress?: (v: string) => void;
  plotLatitude?: string;
  setPlotLatitude?: (v: string) => void;
  plotLongitude?: string;
  setPlotLongitude?: (v: string) => void;
  plotImages?: Type1ImageFile[];
  setPlotImages?: (v: Type1ImageFile[]) => void;

  // Multi-target structured recording callbacks
  targetActualResults?: Type1TargetActualItem[];
  onUpdateTargetActualResults?: (results: Type1TargetActualItem[]) => void;
}

export type ActualType1VisitProps = Type1ActualFormProps;

/**
 * TYPE 1 Actual Result outcome data (activity_results + attachments)
 */
export interface Type1ActualData {
  productAdvice?: string | null;
  discussionResult?: string | null;
  salesOpportunity?: "สูง" | "ต่ำ" | "" | null;
  nextMeetingDate?: Date | string | null;
  farmerHomeAddress?: string | null;
  plotLatitude?: number | string | null;
  plotLongitude?: number | string | null;
  plotImages?: Type1ImageFile[];
  advisedProducts?: Type1AdviceProductItem[];
}
