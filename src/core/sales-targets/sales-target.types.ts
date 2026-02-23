export interface ProductInfo {
  id: string;
  productCode: string;
  name: string;
  productGroup: string | null;
}

export interface DetailedTargetItem {
  id?: string;
  productId: string;
  quantity: number;
  amount: number;
  product?: {
    name: string;
    productCode: string;
  };
}

export interface DetailedTarget {
  id: string;
  year: number;
  month: number;
  employeeId: string;
  customerId: string;
  totalAmount: number;
  status: string;
  items: DetailedTargetItem[];
  employee?: {
    id: string;
    name: string;
    employeeCode: string;
  };
  customer?: {
    id: string;
    name: string;
    customerCode: string;
  };
}

export interface MonthlyTarget {
  month: number | null;
  targetAmount: string; // API returns string, potentially
  notes?: string;
  year?: number;
}

// Input Types
export interface CreateDetailedTargetInput {
  year: number;
  month: number;
  employeeId: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    amount: number;
  }[];
}

export interface UpdateDetailedTargetInput extends CreateDetailedTargetInput {
  id: string;
}

export interface ISalesTargetFilters {
  year: number;
  month?: number;
  employeeId?: string;
  shopId?: string;
}
