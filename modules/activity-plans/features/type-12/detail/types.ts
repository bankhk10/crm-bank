import type { TourType, TourSize } from "../shared/types";

export interface DetailType12TourProps {
  isVisible: boolean;
  tourType?: TourType | null;
  tourSize?: TourSize | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
}
