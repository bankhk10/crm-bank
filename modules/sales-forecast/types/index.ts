export interface PersonalForecastEntry {
  employeeId: string;
  employeeName: string;
  region: string | null;
  month: number;
  totalAmount: number;
  totalQuantity: number;
  details: {
    productId: string;
    productName: string;
    month: number;
    shopId: string;
    shopName: string;
    amount: number;
    quantity: number;
  }[];
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
