import type {
  CustomerOption,
  ProductOption,
  Type6ImageFile,
} from "../../shared/types";

/**
 * Data structure for an unplanned Type 6 issue complaint item
 * Combines customer target + on-the-spot investigation results (lot, channel, product, photos, resolution status)
 */
export interface Type6UnplannedItem {
  id: string;

  // Target Customer
  isManualCustomer?: boolean;
  storeId?: string | null;
  customerName?: string;
  manualCustomerName?: string;
  manualCustomerAddress?: string;
  manualCustomerPhone?: string;

  // Issue Classification
  issueType: string;
  detail: string;

  // Actual Investigation Details
  purchaseChannel?: string;
  productId?: string | null;
  productName?: string;
  lotNumber?: string;
  status: "เสร็จสิ้น" | "รอติดตาม";

  // Evidence Photos
  images?: Type6ImageFile[];
}

/**
 * Props for Type 6 Unplanned Form component
 */
export interface Type6UnplannedFormProps {
  readonly?: boolean;
  items: Type6UnplannedItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type6UnplannedItem, val: any) => void;
  deleteItem?: (id: string) => void;
}
