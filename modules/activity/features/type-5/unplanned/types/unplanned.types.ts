import type {
  CustomerOption,
  ProductOption,
  Type5ImageFile,
} from "../../shared/types";

/**
 * Data structure for an unplanned Type 5 market survey item
 * Combines planned comparison target + on-the-spot survey results & 4-tier pricing
 */
export interface Type5UnplannedItem {
  id: string;

  // Target info
  storeId?: string;
  storeName?: string;
  productId?: string;
  comparedProduct: string;
  detail?: string;

  // Actual recording fields (completed on-the-spot)
  competitorBrand: string;
  competitorProduct: string;
  posPrice?: number | null;
  dealerPrice?: number | null;
  subdealerPrice?: number | null;
  farmerPrice?: number | null;
  sellingPoints?: string;

  // Photos
  bottleImages?: Type5ImageFile[];
  promotionalImages?: Type5ImageFile[];
}

/**
 * Props for Type 5 Unplanned Form component
 */
export interface Type5UnplannedFormProps {
  readonly?: boolean;
  items: Type5UnplannedItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type5UnplannedItem, val: any) => void;
  deleteItem?: (id: string) => void;
}
