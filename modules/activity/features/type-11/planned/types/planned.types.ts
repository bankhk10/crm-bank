import type React from "react";
import type {
  Type11StoreItem,
  Type11CustomerOption,
  Type11ProductEntity,
  Type11ResultEntity,
} from "../../shared/types";

export interface Type11TargetStoreItem {
  id?: string;
  targetId?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  detail?: string;
  notes?: string;
}

export interface Type11TargetItem {
  id?: string;
  targetId?: string;
  storeId?: string | null;
  store: string;
  storeName?: string;
  isUnregisteredStore?: boolean;
  storeCode?: string | null;
  province?: string | null;
  district?: string | null;
  dealerId?: string | null;
  dealerName?: string | null;
  visitPurpose?: string | null;
  detail?: string;
  targetOpportunity?: string;
  notes?: string;
  items?: Type11TargetStoreItem[];
  products?: Type11ProductEntity[];
  result?: Type11ResultEntity | null;
  [key: string]: any;
}

export type Type11PlanTarget = Type11TargetItem;

export interface Type11PlanItem {
  id?: string;
  targetId?: string;
  storeId?: string | null;
  storeName?: string | null;
  isUnregisteredStore?: boolean;
  storeCode?: string | null;
  province?: string | null;
  district?: string | null;
  dealerId?: string | null;
  dealerName?: string | null;
  visitPurpose?: string | null;
  notes?: string | null;
  products?: Type11ProductEntity[];
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
