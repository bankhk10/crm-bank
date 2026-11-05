/**
 * Type 15 Feature: Planned Types & Interfaces (บูมทีม / คาราวาน)
 */

import type { CustomerOption, Type15BoomItem } from "../../shared/types";

export interface Type15PlanFormProps {
  isVisible?: boolean;
  customers?: CustomerOption[];
  type15Items: Type15BoomItem[];
  addType15Row: () => void;
  updateType15Row: (id: string, field: keyof Type15BoomItem, val: any) => void;
  deleteType15Row: (id: string) => void;
  title?: string;
  isPlanned?: boolean;
  readonly?: boolean;
}

export type Type15PlannedFormProps = Type15PlanFormProps;

export interface ValidateType15Options {
  items?: Type15BoomItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type15ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UseType15PlannedFormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType15PlannedFormResult {
  type15Items: Type15BoomItem[];
  setType15Items: React.Dispatch<React.SetStateAction<Type15BoomItem[]>>;
  addType15Row: () => void;
  updateType15Row: (id: string, field: keyof Type15BoomItem, val: any) => void;
  deleteType15Row: (id: string) => void;
  validateType15: () => { isValid: boolean; error?: string };
  mapType15Payload: (customers: any[]) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string | null;
      storeName: string | null;
      remarks?: string | null;
      notes?: string | null;
    }>;
    type15Items: Type15BoomItem[];
  };
}

