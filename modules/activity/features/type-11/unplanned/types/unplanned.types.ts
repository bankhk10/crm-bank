import type React from "react";
import type {
  Type11StockItem,
  Type11ImageFile,
  Type11CustomerOption,
  Type11ProductOption,
} from "../../shared/types";

export interface Type11UnplannedItem {
  id: string;
  storeId?: string | null;
  storeName: string;
  stockItems: Type11StockItem[];
  nextAction?: string;
  remarks?: string;
  images: Type11ImageFile[];
}

export interface Type11UnplannedFormProps {
  readonly?: boolean;
  items: Type11UnplannedItem[];
  customers?: Type11CustomerOption[];
  products?: Type11ProductOption[];
  addItem?: () => void;
  updateItem: (
    id: string,
    field: keyof Type11UnplannedItem | string,
    value: any,
  ) => void;
  deleteItem?: (id: string) => void;
  addStockItem?: (itemId: string, selectedProductId?: string) => void;
  updateStockItem?: (
    itemId: string,
    stockItemId: string,
    field: keyof Type11StockItem,
    value: any,
  ) => void;
  deleteStockItem?: (itemId: string, stockItemId: string) => void;
}

export interface Type11UnplannedValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface UseType11UnplannedFormOptions {
  initialItems?: Type11UnplannedItem[];
  customersList?: Type11CustomerOption[];
  productsList?: Type11ProductOption[];
}

export interface UseType11UnplannedFormResult {
  items: Type11UnplannedItem[];
  addItem: () => void;
  updateItem: (
    id: string,
    field: keyof Type11UnplannedItem | string,
    value: any,
  ) => void;
  deleteItem: (id: string) => void;
  addStockItem: (itemId: string, selectedProductId?: string) => void;
  updateStockItem: (
    itemId: string,
    stockItemId: string,
    field: keyof Type11StockItem,
    value: any,
  ) => void;
  deleteStockItem: (itemId: string, stockItemId: string) => void;
  validate: () => Type11UnplannedValidationResult;
  setItems: React.Dispatch<React.SetStateAction<Type11UnplannedItem[]>>;
}
