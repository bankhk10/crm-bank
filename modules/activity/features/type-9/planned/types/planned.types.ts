import type React from "react";
import type {
  Type9ProductItem,
  Type9CustomerOption,
  Type9ProductOption,
  Type9TargetProductItem,
} from "../../shared/types";

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
  salesRatio?: number | string;
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

export interface Type9PlanTarget {
  store?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  product?: string;
  targetSales?: number | string;
  salesRatio?: number | string;
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

export interface Type9PlannedFormProps {
  readonly?: boolean;
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

  customers?: Type9CustomerOption[];
  products?: Type9ProductOption[];
}

export type Type9PlanFormProps = Type9PlannedFormProps;
export type Type9StoreProps = Type9PlannedFormProps;

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

export interface UseType9PlannedFormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType9PlannedFormResult {
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
  type9Store: string;
  setType9Store: React.Dispatch<React.SetStateAction<string>>;
  type9IsSubDealer: boolean;
  setType9IsSubDealer: React.Dispatch<React.SetStateAction<boolean>>;
  type9SubDealerStore: string;
  setType9SubDealerStore: React.Dispatch<React.SetStateAction<string>>;
  type9Sales: number;
  setType9Sales: React.Dispatch<React.SetStateAction<number>>;
  type9Products: string;
  setType9Products: React.Dispatch<React.SetStateAction<string>>;
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
  mapType9Payload: (
    customers: any[],
    products: any[],
  ) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string | null;
      storeName: string | null;
      subDealerStore: string | null;
      province: string | null;
      targetAmount: number | null;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      storeId: string | null;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      unitPrice: number;
      totalAmount: number;
      isPriceOverridden: boolean;
    }>;
  };
}
