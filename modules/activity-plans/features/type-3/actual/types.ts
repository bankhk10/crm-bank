export interface TargetProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  qty?: string;
  unitPrice?: string;
  detail?: string;
  notes?: string;
  unit?: string;
  price?: string;
  targetSales?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface Type3ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  qty?: string;
  unitPrice?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface ActualType3SalesProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: {
    product?: string;
    customer?: string;
    targetQty?: string;
    targetSales?: string;
    unitPrice?: string;
    detail?: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    dealerName?: string;
    items?: TargetProductItem[];
  };
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  soldProducts: string;
  setSoldProducts: (v: string) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualQuantity: string;
  setActualQuantity: (v: string) => void;
  unclosedReason: string;
  setUnclosedReason: (v: string) => void;
  productSalesDetails?: Type3ProductSaleDetail[];
  setProductSalesDetails?: (v: Type3ProductSaleDetail[]) => void;
}

export interface DetailType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    dealerName?: string;
    targetQty: string;
    targetSales?: string;
    unitPrice?: string;
    detail?: string;
    items?: TargetProductItem[];
  };
  soldProducts?: string;
  actualSales?: string;
  actualQuantity?: string;
  unclosedReason?: string;
  productSalesDetails?: Type3ProductSaleDetail[];
}

export interface ApprovalType3SalesProps {
  isVisible: boolean;
  target: {
    product?: string;
    customer?: string;
    targetSales?: string;
    targetQty?: string;
    items?: Array<{
      productName: string;
      qty?: string;
      unitPrice?: string;
      price?: string;
      detail?: string;
    }>;
  };
}
