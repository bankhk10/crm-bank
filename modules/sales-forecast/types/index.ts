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

export interface TradeNameForecastEntry {
  tradeNameGroup: string;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface ProductForecastEntry {
  productId: string;
  productCode: string;
  productName: string;
  tradeNameGroup: string | null;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface ABCForecastEntry {
  abcCode: string;
  abcName: string;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface SalesForecastResponse {
  personal: PersonalForecastEntry[];
  tradeNameGroup: TradeNameForecastEntry[];
  product: ProductForecastEntry[];
  abc: ABCForecastEntry[];
  actualSales: Array<{ month: number; totalAmount: number }>;
  tradeNameGroupLabels: Record<string, string>;
  abcLabels: Record<string, string>;
}
