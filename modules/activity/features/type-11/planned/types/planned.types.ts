import type React from "react";
import type { Type11StoreItem, Type11CustomerOption } from "../../shared/types";

export interface Type11TargetStoreItem {
  storeId?: string;
  store?: string;
  storeName?: string;
  detail?: string;
}

export interface Type11TargetItem {
  id?: string;
  store: string;
  detail: string;
  targetOpportunity?: string;
  items?: Type11TargetStoreItem[];
  [key: string]: any;
}

export type Type11PlanTarget = Type11TargetItem;

export interface Type11PlanItem {
  storeId: string;
  storeName?: string | null;
  notes?: string | null;
}

export interface Type11PlannedFormProps {
  readonly?: boolean;
  type11Stores: Type11StoreItem[] | string;
  setType11Stores: (val: Type11StoreItem[]) => void;
  customers?: Type11CustomerOption[];
}

export type Type11StockProps = Type11PlannedFormProps;
export type Type11PlanFormProps = Type11PlannedFormProps;

export interface Type11PlanCardProps {
  target?: Type11TargetItem;
  planType?: string;
  className?: string;
}

export interface ValidateType11Options {
  selectedWorkTypes?: string[];
  stores?: Type11StoreItem[] | string;
  type11Stores?: Type11StoreItem[] | string;
}

export interface Type11ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface UseType11PlannedFormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: Type11CustomerOption[];
  selectedWorkTypes?: string[];
}

export interface UseType11PlannedFormResult {
  type11Stores: Type11StoreItem[];
  setType11Stores: React.Dispatch<React.SetStateAction<Type11StoreItem[]>>;
  validateType11: () => Type11ValidationResult;
  mapType11Payload: () => {
    type11Stores: Type11StoreItem[];
  };
}
