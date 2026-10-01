import type React from "react";
import type {
  ImageFile,
  ActualTargetsState,
} from "@/modules/activity-plans/features/shared/actual-view/types";

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
  actualQuantityCases?: string;
  actualSales?: string;
}

export interface ActualType9StoreProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target: {
    store: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    product?: string;
    targetSales: string;
    targetAttendees?: string;
    items?: Type9TargetProductItem[];
  };
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
  target: {
    store: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    product?: string;
    targetSales: string;
    targetAttendees?: string;
    items?: Type9TargetProductItem[];
  };
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: ImageFile[];
}

export interface ApprovalType9StoreProps {
  isVisible: boolean;
  target: ActualTargetsState["t9"];
}
