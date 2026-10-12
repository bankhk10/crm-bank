import type { Type1ImageFile, Type1TargetItem, ProductOption } from "../types";
export type { ProductOption };

export interface ActualType1VisitProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  planType?: "PLANNED" | "UNPLANNED" | string;
  productAdvice: string;
  setProductAdvice: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  discussionResult: string;
  setDiscussionResult: (v: string) => void;
  salesOpportunity: "สูง" | "ต่ำ" | "";
  setSalesOpportunity: (v: "สูง" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
  nextMeetingDate: string;
  setNextMeetingDate: (v: string) => void;
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
}
