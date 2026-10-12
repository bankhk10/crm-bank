import type React from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import type {
  Type9ProductItem,
  CustomerOption,
  ProductOption,
} from "../shared/types";

export type { Type9ProductItem, CustomerOption, ProductOption };

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

export interface DetailType9StoreProps {
  isVisible: boolean;
  target: Type9TargetItem;
  targets?: Type9TargetItem[];
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: ImageFile[];
}

export interface ApprovalType9StoreProps {
  isVisible: boolean;
  target: Type9TargetItem;
  targets?: Type9TargetItem[];
}
