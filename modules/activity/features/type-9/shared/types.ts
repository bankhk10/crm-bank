import type { Type1ImageFile } from "@/modules/activity/features/type-1";

export type Type9ImageFile = Type1ImageFile;

export interface Type9ProductItem {
  id: string;
  productId?: string;
  productName: string;
  packageSizePerBox?: number;
  quantityCases: number;
  pricePerBottle?: number;
  pricePerCase: number;
  totalAmount?: number;
}

export interface Type9CustomerOption {
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

export interface Type9ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  cartonPrice?: number | null;
  packageSizePerBox?: number | null;
  unit?: string | null;
}

export type Type9ProductRole = "TARGET" | "ADDITIONAL_SALE";

export interface Type9TargetProductItem {
  id?: string;
  targetId?: string;
  productId?: string;
  storeId?: string | null;
  productName: string;
  productRole?: Type9ProductRole | string;
  packageSizePerBox?: number;
  quantityCases?: number;
  pricePerBottle?: number;
  pricePerCase?: number;
  totalAmount?: number;
  actualQuantityCases?: number | string;
  actualBottleQuantity?: number | string;
  actualSales?: number | string;
  actualNotes?: string;
}

export interface Type9ProductSaleDetail {
  id?: string;
  targetId?: string;
  productId?: string;
  storeId?: string | null;
  productName: string;
  productRole?: Type9ProductRole | string;
  packageSizePerBox?: number;
  pricePerBottle?: number;
  pricePerCase?: number;
  quantityCases?: number;
  totalAmount?: number;
  actualQuantityCases?: string | number;
  actualBottleQuantity?: string | number;
  actualSales?: string | number;
  actualNotes?: string;
}

export interface Type9DbTarget {
  id: string;
  activityPlanId: string;
  subdealerId?: string | null;
  subdealerName?: string | null;
  isUnregisteredSubdealer: boolean;
  subDealerStore?: string | null;
  province?: string | null;
  district?: string | null;
  dealerId?: string | null;
  dealerName?: string | null;
  targetSales?: any;
  salesRatio?: any;
  targetAttendeesCount?: number;
  notes?: string | null;
  subdealer?: any;
  dealer?: any;
  products?: Type9DbProduct[];
  result?: Type9DbResult | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Type9DbProduct {
  id: string;
  activityPlanId: string;
  targetId: string;
  productId?: string | null;
  productName?: string | null;
  productRole: Type9ProductRole | string;
  targetQuantity?: any;
  targetUnitPrice?: any;
  targetAmount?: any;
  packageSizePerBox?: any;
  actualQuantity?: any;
  actualBottleQuantity?: any;
  actualUnitPrice?: any;
  actualTotal?: any;
  actualNotes?: string | null;
  product?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Type9DbResult {
  id: string;
  activityPlanId: string;
  targetId: string;
  actualAttendeesCount: number;
  actualTotalSales?: any;
  customerFeedback?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
