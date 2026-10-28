/**
 * Unplanned Types for Type 3: เสนอขายสินค้า 2-in-1 (Unplanned Sales Proposal)
 */

import type { StoreOption, ProductOption } from "../../shared/types";

export interface Type3UnplannedProductItem {
  id: string;
  productId: string;
  productName: string;
  targetQuantity: number;
  actualQuantity: number;
  unitPrice: number;
  actualTotal: number;
  unclosedReason?: string;
  notes?: string;
}

export interface Type3UnplannedItem {
  id: string;
  storeId?: string;
  storeName?: string;
  isSubDealer?: boolean;
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
  subDealerStore?: string;
  dealerName?: string;
  notes?: string;
  products: Type3UnplannedProductItem[];
}

export interface Type3UnplannedFormProps {
  items: Type3UnplannedItem[];
  addItem: () => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, field: keyof Type3UnplannedItem, value: any) => void;
  addProduct: (itemId: string) => void;
  removeProduct: (itemId: string, prodId: string) => void;
  updateProduct: (
    itemId: string,
    prodId: string,
    field: keyof Type3UnplannedProductItem,
    value: any,
    productOption?: ProductOption,
  ) => void;
  customers?: StoreOption[];
  products?: ProductOption[];
  readonly?: boolean;
}

export interface Type3UnplannedPayload {
  stores: Array<{
    storeId?: string | null;
    isSubDealer: boolean;
    isUnregisteredSubdealer?: boolean;
    subdealerId?: string | null;
    subDealerStore?: string | null;
    notes?: string | null;
  }>;
  products: Array<{
    storeId?: string | null;
    productId: string;
    productName: string;
    targetQuantity: number;
    unitPrice: number;
    targetAmount: number;
    notes?: string | null;
  }>;
  saleResults: Array<{
    storeId?: string | null;
    productId: string;
    productName: string;
    actualQuantity: number;
    actualUnitPrice: number;
    actualTotal: number;
    unclosedReason?: string | null;
    isAdditional?: boolean;
  }>;
}
