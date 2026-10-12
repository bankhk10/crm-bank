import type React from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface Type9ProductItem {
  id: string;
  productId?: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  phone?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  parentDealerId?: string | null;
  parentDealer?: {
    id: string;
    customerCode?: string | null;
    name: string;
  } | null;
  responsibleEmployeeId?: string | null;
  [key: string]: any;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export type EditCustomerOption = CustomerOption;
export type EditProductOption = ProductOption;

export interface Type9TargetProductItem {
  id?: string;
  productId?: string;
  storeId?: string | null;
  productName: string;
  quantityCases?: number;
  pricePerCase?: number;
  totalAmount?: number;
  actualQuantityCases?: number | string;
  actualSales?: number | string;
}

export interface Type9ProductSaleDetail {
  id?: string;
  productId?: string;
  storeId?: string | null;
  productName: string;
  pricePerCase?: number;
  quantityCases?: number;
  totalAmount?: number;
  actualQuantityCases?: string | number;
  actualSales?: string | number;
}

export interface Type9TargetItem {
  id?: string;
  storeId?: string | null;
  store: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  province?: string;
  district?: string;
  product?: string;
  targetSales: string;
  targetAttendees?: string;
  items?: Type9TargetProductItem[];
  [key: string]: any;
}

export interface Type9PlanItem {
  stores: Array<{
    storeId?: string | null;
    storeName?: string | null;
    subDealerStore?: string | null;
    province?: string | null;
    targetAmount?: number | null;
  }>;
  products: Array<{
    productId: string;
    productName?: string | null;
    targetQuantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export interface Type9ActualRecord {
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: ImageFile[];
}

// Plan Card Types
export interface Type9PlanTarget {
  store?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  product?: string;
  targetSales?: number | string;
  targetAttendees?: number | string;
  items?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    quantityCases?: number | string;
    pricePerCase?: number;
    totalAmount?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface Type9PlanCardProps {
  target?: Type9PlanTarget;
  planType?: string;
  className?: string;
  hideItemsTable?: boolean;
}

// Plan Form Types
export interface Type9StoreProps {
  readonly?: boolean;
  // Sub Dealer state & handlers
  subdealerId?: string;
  setSubdealerId?: (val: string) => void;
  subdealerName?: string;
  setSubdealerName?: (val: string) => void;
  isUnregisteredSubdealer?: boolean;
  setIsUnregisteredSubdealer?: (val: boolean) => void;
  subDealerStore?: string;
  setSubDealerStore?: (val: string) => void;
  province?: string;
  setProvince?: (val: string) => void;
  district?: string;
  setDistrict?: (val: string) => void;
  parentDealerId?: string;
  setParentDealerId?: (val: string) => void;
  parentDealerName?: string;
  setParentDealerName?: (val: string) => void;

  // Backward compatibility
  type9Store?: string;
  setType9Store?: (val: string) => void;
  isSubDealer?: boolean;
  setIsSubDealer?: (val: boolean) => void;

  // Sales & products
  type9Sales: number;
  setType9Sales: (val: number) => void;
  type9ProductItems: Type9ProductItem[];
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;

  customers?: CustomerOption[];
  products?: ProductOption[];
}

export type Type9PlanFormProps = Type9StoreProps;

// Actual Form Types
export interface ActualType9StoreProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target: Type9TargetItem;
  targets?: Type9TargetItem[];
  formats?: string[];
  setFormats?: (v: string[]) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  productSalesDetails?: Type9ProductSaleDetail[];
  setProductSalesDetails?: (v: Type9ProductSaleDetail[]) => void;
  actualAttendees?: string;
  setActualAttendees?: (v: string) => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export type Type9ActualFormProps = ActualType9StoreProps;

// Detail View Props
export interface DetailType9StoreProps {
  isVisible: boolean;
  target: Type9TargetItem;
  targets?: Type9TargetItem[];
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: ImageFile[];
}

export type Type9DetailViewProps = DetailType9StoreProps;

// Approval Card Props
export interface ApprovalType9StoreProps {
  isVisible: boolean;
  target: Type9TargetItem;
  targets?: Type9TargetItem[];
}

export type Type9ApprovalCardProps = ApprovalType9StoreProps;

// Validation Types
export interface ValidateType9Options {
  selectedWorkTypes?: string[];
  isUnregisteredSubdealer?: boolean;
  subDealerStore?: string;
  subDealerProvince?: string;
  subDealerDistrict?: string;
  subdealerId?: string;
}

export interface Type9ValidationResult {
  isValid: boolean;
  error?: string;
}

// Hook Types
export interface UseType9FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType9FormResult {
  subdealerId: string;
  setSubdealerId: React.Dispatch<React.SetStateAction<string>>;
  subdealerName: string;
  setSubdealerName: React.Dispatch<React.SetStateAction<string>>;
  isUnregisteredSubdealer: boolean;
  setIsUnregisteredSubdealer: React.Dispatch<React.SetStateAction<boolean>>;
  subDealerStore: string;
  setSubDealerStore: React.Dispatch<React.SetStateAction<string>>;
  subDealerProvince: string;
  setSubDealerProvince: React.Dispatch<React.SetStateAction<string>>;
  subDealerDistrict: string;
  setSubDealerDistrict: React.Dispatch<React.SetStateAction<string>>;
  parentDealerId: string;
  setParentDealerId: React.Dispatch<React.SetStateAction<string>>;
  parentDealerName: string;
  setParentDealerName: React.Dispatch<React.SetStateAction<string>>;
  type9Sales: number;
  setType9Sales: React.Dispatch<React.SetStateAction<number>>;
  type9ProductItems: Type9ProductItem[];
  setType9ProductItems: React.Dispatch<React.SetStateAction<Type9ProductItem[]>>;
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;
  validateType9: () => Type9ValidationResult;
  mapType9Payload: (products: any[]) => {
    type9Data?: {
      stores?: Array<{
        storeId?: string | null;
        subDealerStore?: string | null;
        province?: string | null;
        district?: string | null;
        targetAmount?: number | null;
        isSubDealer?: boolean;
      }>;
      products?: Array<{
        productId: string;
        targetQuantity: number;
        unitPrice: number;
        totalAmount: number;
      }>;
    };
  };
}
