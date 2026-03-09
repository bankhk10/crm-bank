export interface PersonalForecastEntry {
  employeeId: string;
  employeeName: string;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface GroupForecastEntry {
  productGroup: string;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface ProductForecastEntry {
  productId: string;
  productCode: string;
  productName: string;
  productGroup: string | null;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface SalesForecastResponse {
  personal: PersonalForecastEntry[];
  group: GroupForecastEntry[];
  product: ProductForecastEntry[];
  actualSales: Array<{ month: number; totalAmount: number }>;
  groupLabels: Record<string, string>;
}
