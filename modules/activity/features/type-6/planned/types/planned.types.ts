/**
 * Type 6 Feature: Planned Types & Interfaces
 */

import type { CustomerOption, Type6IssueItem } from "../../shared/types";

export interface Type6PlanFormProps {
  isVisible?: boolean;
  customers: CustomerOption[];
  type6Items: Type6IssueItem[];
  addType6Row: () => void;
  updateType6Row: (id: string, field: keyof Type6IssueItem, val: any) => void;
  deleteType6Row: (id: string) => void;
  title?: string;
  isPlanned?: boolean;
  readonly?: boolean;
}

export type Type6PlannedFormProps = Type6PlanFormProps;

export interface ValidateType6Options {
  items?: Type6IssueItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type6ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UseType6FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType6FormResult {
  type6Items: Type6IssueItem[];
  setType6Items: React.Dispatch<React.SetStateAction<Type6IssueItem[]>>;
  addType6Row: () => void;
  updateType6Row: (id: string, field: keyof Type6IssueItem, val: any) => void;
  deleteType6Row: (id: string) => void;
  validateType6: () => { isValid: boolean; error?: string };
  mapType6Payload: (customers: any[]) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string | null;
      storeName: string | null;
      remarks?: string | null;
      notes?: string | null;
    }>;
    type6Items?: Type6IssueItem[];
  };
}

export type UseType6PlannedFormResult = UseType6FormResult;
export type UseType6PlannedFormOptions = UseType6FormOptions;
