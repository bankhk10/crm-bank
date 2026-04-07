/**
 * Sales Targets Feature - Types
 *
 * Hierarchical structure: SalesTarget → SalesTargetStore → SalesTargetItem
 */

export interface ProductInfo {
  id: string;
  productCode: string;
  name: string;
  unit?: string | null;
  cartonPrice?: number | null;
}

export interface SalesTargetItemData {
  id?: string;
  productId: string;
  pricePerBox: number;
  qtyPerBox: number;
  targetAmount: number;
  product?: {
    id: string;
    name: string;
    productCode: string;
    unit?: string | null;
    cartonPrice?: number | null;
  };
}

export interface SalesTargetStoreData {
  id?: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    customerCode: string;
  };
  items: SalesTargetItemData[];
}

export interface DetailedTarget {
  id: string;
  year: number;
  month: number;
  employeeId: string;
  createdById?: string | null;
  employee?: {
    id: string;
    name: string;
    employeeCode: string;
    departmentId?: string | null;
  };
  stores: SalesTargetStoreData[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Input Types
export interface CreateSalesTargetInput {
  year: number;
  month: number;
  employeeId: string;
  stores: {
    customerId: string;
    items: {
      productId: string;
      pricePerBox: number;
      qtyPerBox: number;
      targetAmount: number;
    }[];
  }[];
}

export interface UpdateSalesTargetInput extends CreateSalesTargetInput {
  id: string;
}

export interface ISalesTargetFilters {
  year: number;
  month?: number;
  employeeId?: string;
  shopId?: string;
}
