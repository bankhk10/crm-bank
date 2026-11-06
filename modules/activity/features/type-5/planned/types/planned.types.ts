import type { CustomerOption, ProductOption } from "../../shared/types";

export interface Type5SurveyItem {
  id: string;
  storeId?: string;
  storeName: string;
  productId?: string;
  comparedProduct: string;
  detail: string;
}

export interface TargetSurveyItem {
  id?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  productId?: string;
  product?: string;
  productName?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type5TargetItem {
  id?: string;
  storeId?: string;
  store: string;
  storeName?: string;
  productId?: string;
  product: string;
  productName?: string;
  detail?: string;
  notes?: string;
  items?: TargetSurveyItem[];
  [key: string]: any;
}

export interface Type5PlanCardTargetItem {
  id?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  productId?: string;
  product?: string;
  productName?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type5PlanCardTarget {
  store?: string;
  storeId?: string;
  product?: string;
  productId?: string;
  detail?: string;
  notes?: string;
  items?: Type5PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type5PlanCardProps {
  planType?: string;
  target?: Type5PlanCardTarget | null;
  className?: string;
}

export interface Type5PlannedFormProps {
  readonly?: boolean;
  type5Items: Type5SurveyItem[];
  addType5Row: () => void;
  updateType5Row: (id: string, field: keyof Type5SurveyItem, val: any) => void;
  deleteType5Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

// Backward-compatible aliases
export type Type5PlanFormProps = Type5PlannedFormProps;
export type Type5SurveyProps = Type5PlannedFormProps;
export type EditType5SurveyProps = Type5PlannedFormProps;

export interface ValidateType5Options {
  items?: Type5SurveyItem[];
  customersList?: Array<{ id: string; name: string }>;
  productsList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type5ValidationResult {
  isValid: boolean;
  error?: string;
}
