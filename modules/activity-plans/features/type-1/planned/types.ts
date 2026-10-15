import type { CustomerOption } from "../shared/types";

/**
 * Data structure for a planned Type 1 visit item (in-plan creation & edit)
 */
export interface Type1PlannedItem {
  id: string;
  visitPurpose: "FARMER" | "STORE";
  storeId?: string;
  customerName?: string;
  province?: string;
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  topic: string;
  detail: string;
}

/**
 * Props for Type 1 Planned Form component
 */
export interface Type1PlannedFormProps {
  readonly?: boolean;
  items: Type1PlannedItem[];
  customers?: CustomerOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type1PlannedItem, val: any) => void;
  deleteItem?: (id: string) => void;
}
