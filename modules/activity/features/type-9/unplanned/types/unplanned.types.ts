import type {
  Type9ImageFile,
  Type9ProductItem,
  Type9ProductSaleDetail,
  Type9CustomerOption,
  Type9ProductOption,
} from "../../shared/types";

export interface Type9UnplannedItem {
  id: string;
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subdealerName?: string;
  subDealerStore?: string;
  province?: string;
  district?: string;
  parentDealerId?: string;
  parentDealerName?: string;

  targetSales?: number;
  actualSales?: string;
  actualAttendees?: string;

  products?: Type9ProductItem[];
  productSalesDetails?: Type9ProductSaleDetail[];

  notes?: string;
  images?: Type9ImageFile[];
}

export interface Type9UnplannedValidationResult {
  isValid: boolean;
  errors?: string[];
  error?: string;
}

export interface Type9UnplannedFormProps {
  readonly?: boolean;
  items: Type9UnplannedItem[];
  customers?: Type9CustomerOption[];
  products?: Type9ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type9UnplannedItem | string, val: any) => void;
  deleteItem?: (id: string) => void;
  addProductItem?: (itemId: string) => void;
  updateProductItem?: (
    itemId: string,
    prodId: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteProductItem?: (itemId: string, prodId: string) => void;
}

export interface UseType9UnplannedFormOptions {
  initialItems?: Type9UnplannedItem[];
  customersList?: Type9CustomerOption[];
  productsList?: Type9ProductOption[];
}

export interface UseType9UnplannedFormResult {
  items: Type9UnplannedItem[];
  addItem: () => void;
  updateItem: (id: string, field: keyof Type9UnplannedItem | string, val: any) => void;
  deleteItem: (id: string) => void;
  addProductItem: (itemId: string) => void;
  updateProductItem: (
    itemId: string,
    prodId: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteProductItem: (itemId: string, prodId: string) => void;
  validate: () => Type9UnplannedValidationResult;
  setItems: React.Dispatch<React.SetStateAction<Type9UnplannedItem[]>>;
}
