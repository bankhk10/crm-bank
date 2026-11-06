import type {
  CustomerOption,
  ProductOption,
  Type2ImageFile,
} from "../../shared/types";
import type { UsageResult } from "../../shared/constants";

/**
 * Single product item within an unplanned Type 2 target
 */
export interface Type2UnplannedProductItem {
  id: string;
  productId?: string;
  productName: string;
  notes?: string;
  usageResult?: UsageResult | "";
  followupDetail?: string;
  problemDetail?: string;
  isAdditional?: boolean;
}

/**
 * Data structure for an unplanned Type 2 visit item (combines target + followup actual outcome)
 */
export interface Type2UnplannedItem {
  id: string;

  // Plan target fields
  visitPurpose: "FARMER" | "STORE";
  storeId?: string;
  customerName?: string;
  province?: string;
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  notes?: string;

  // Tracked products with their actual feedback
  products: Type2UnplannedProductItem[];

  // Supporting plot/crop images
  images?: Type2ImageFile[];
}

/**
 * Props for Type 2 Unplanned Form component
 */
export interface Type2UnplannedFormProps {
  readonly?: boolean;
  items: Type2UnplannedItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type2UnplannedItem, val: any) => void;
  deleteItem?: (id: string) => void;
  addProductToItem?: (itemId: string) => void;
  updateProductInItem?: (
    itemId: string,
    prodId: string,
    field: keyof Type2UnplannedProductItem,
    val: any,
  ) => void;
  deleteProductFromItem?: (itemId: string, prodId: string) => void;
}
