import type {
  CustomerOption,
  ProductOption,
  Type1AdviceProductItem,
  Type1ImageFile,
} from "../../shared/types";

/**
 * Data structure for an unplanned Type 1 visit item (combines target + actual outcome)
 */
export interface Type1UnplannedItem {
  id: string;

  // Plan target fields
  visitPurpose: "FARMER" | "STORE";
  storeId?: string;
  customerName?: string;
  province?: string;
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  topic: string;
  detail: string;

  // Actual recording fields (completed on-the-spot)
  discussionResult: string;
  productAdvice?: string;
  advisedProducts?: Type1AdviceProductItem[];
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  nextAction?: string;
  nextMeetingDate?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string;
  plotLongitude?: string;
  plotImages?: Type1ImageFile[];
}

/**
 * Props for Type 1 Unplanned Form component
 */
export interface Type1UnplannedFormProps {
  readonly?: boolean;
  items: Type1UnplannedItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type1UnplannedItem, val: any) => void;
  deleteItem?: (id: string) => void;
}
