import type { CustomerOption, Type1ImageFile } from "../../shared/types";

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
  notes: string;
  detail?: string;
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

/**
 * Target representation in approved plan / detail views
 */
export interface Type1TargetItem {
  id?: string;
  storeId?: string;
  customer: string;
  topic: string;
  notes?: string;
  detail?: string;
  opportunity?: string;
  nextDate?: string;
  visitPurpose?: "FARMER" | "STORE";
  customerType?: string;
  province?: string;
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string | number | null;
  plotLongitude?: string | number | null;
  plotImages?: Type1ImageFile[];
  productAdvice?: string;
  advisedProducts?: import("../../shared/types").Type1AdviceProductItem[];
  discussionResult?: string;
  salesOpportunity?: string;
  nextAction?: string;
  nextMeetingDate?: string;
}

/**
 * Props for Type 1 Plan Card summary component
 */
export interface Type1PlanCardProps {
  planType?: string;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  className?: string;
}

/**
 * Props for Type 1 Detail View component
 */
export interface Type1DetailViewProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  productAdvice?: string;
  discussionResult?: string;
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  nextAction?: string;
  nextMeetingDate?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string | number | null;
  plotLongitude?: string | number | null;
  plotImages?: Type1ImageFile[];
}

/**
 * Props for Type 1 Approval View / Card component
 */
export interface Type1ApprovalCardProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
}
