import type { CustomerOption } from "../shared/types";

export interface Type12TourProps {
  readonly?: boolean;
  type12TourType: string;
  setType12TourType: (val: string) => void;
  type12TourSize: string;
  setType12TourSize: (val: string) => void;
  type12Country: string;
  setType12Country: (val: string) => void;
  type12Store: string;
  setType12Store: (val: string) => void;
  type12Destination: string;
  setType12Destination: (val: string) => void;
  customers?: CustomerOption[];
}
