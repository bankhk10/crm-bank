import type { TourType, TourSize, CustomerOption } from "../../shared/types";

export type { CustomerOption };

export interface Type12TargetItem {
  id?: string;
  tourType: TourType;
  tourSize?: TourSize | null;
  country?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  destination?: string | null;
  detail?: string;
  [key: string]: any;
}

export type Type12PlanTarget = Type12TargetItem;

export interface Type12PlanItem {
  tourType: "STORE" | "CENTRAL";
  tourSize?: "LARGE" | "SMALL" | null;
  country?: string | null;
  storeId?: string | null;
  destination?: string | null;
}

export interface Type12TourDataPayload {
  tourType: "STORE" | "CENTRAL";
  tourSize: "LARGE" | "SMALL" | null;
  country: string | null;
  storeId: string | null;
  destination: string | null;
}

export interface Type12PlanCardProps {
  isVisible?: boolean;
  planType?: string | null;
  target?: Type12TargetItem;
  targets?: Type12TargetItem[];
  tourType?: TourType | string | null;
  tourSize?: TourSize | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
  className?: string;
  [key: string]: any;
}

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
  type12StoreId?: string;
  setType12StoreId?: (val: string) => void;
  type12Destination: string;
  setType12Destination: (val: string) => void;
  customers?: CustomerOption[];
}

export type Type12PlanFormProps = Type12TourProps;

export interface ValidateType12Params {
  selectedWorkTypes: string[];
  type12TourType: string;
  type12TourSize: string;
  type12Country: string;
  type12Store: string;
  type12Destination: string;
}

export type ValidateType12Options = ValidateType12Params;

export interface Type12ValidationResult {
  isValid: boolean;
  error?: string;
}
