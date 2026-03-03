export interface DateRangeFilter {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface TimeSalesReportData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  growthPercentage: number;
  dailyData: {
    date: string;
    sales: number;
    orders: number;
  }[];
  monthlyData: {
    month: string;
    sales: number;
    orders: number;
  }[];
  yearlyData: {
    year: number;
    sales: number;
    orders: number;
  }[];
  bestSellingHour?: {
    hour: number;
    sales: number;
    orders: number;
  };
  bestSellingDay: {
    dayOfWeek: string;
    sales: number;
    orders: number;
  };
  bestSellingMonth: {
    month: string;
    sales: number;
    orders: number;
  };
  seasonalityData: {
    quarter: string;
    sales: number;
    orders: number;
    percentage: number;
  }[];
  salesByRegion: {
    region: string;
    totalSales: number;
    orderCount: number;
  }[];
}

export interface ProductSalesReportData {
  topProducts: {
    id: string;
    code: string;
    name: string;
    brand: string;
    productGroup: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
  }[];
  slowProducts: {
    id: string;
    code: string;
    name: string;
    brand: string;
    productGroup: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    lastSoldDate?: string;
  }[];
  productPeakPeriods: {
    productId: string;
    productName: string;
    peakMonth: string;
    peakSales: number;
  }[];
  lowStockProducts: {
    id: string;
    code: string;
    name: string;
    physicalBalance: number;
    reservedQuantity: number;
    availableQuantity: number;
    upcomingExpiry?: string;
  }[];
  stagnantProducts: {
    id: string;
    code: string;
    name: string;
    stock: number;
    daysSinceLastSale: number;
    lastSoldDate?: string;
  }[];
}

export interface ProductGroupSalesReportData {
  groupPerformance: {
    group: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    productCount: number;
    avgSalesPerProduct: number;
  }[];
  topGroup: {
    group: string;
    sales: number;
  };
  worstGroup: {
    group: string;
    sales: number;
  };
  groupPeakPeriods: {
    group: string;
    peakMonth: string;
    sales: number;
  }[];
  groupMonthlyTrend: {
    month: string;
    groups: {
      group: string;
      sales: number;
      orders: number;
    }[];
  }[];
}

export interface CustomerSalesReportData {
  topCustomers: {
    id: string;
    code: string;
    name: string;
    type: string;
    province: string;
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
    purchaseFrequency: number;
    lifetimeValue: number;
    lastPurchaseDate?: string;
  }[];
  customerTypeBreakdown: {
    type: string;
    customerCount: number;
    totalSales: number;
    avgSalesPerCustomer: number;
  }[];
  customerAcquisition: {
    newCustomers: number;
    newCustomersSales: number;
    returningCustomers: number;
    returningCustomersSales: number;
  };
  customerByRegion: {
    region: string;
    customerCount: number;
    totalSales: number;
  }[];
  inactiveCustomers: {
    id: string;
    code: string;
    name: string;
    daysSinceLastPurchase: number;
    lifetimeValue: number;
  }[];
}

export interface SalespersonReportData {
  salespersonPerformance: {
    id: string;
    name: string;
    employeeCode: string;
    department: string;
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
    customerCount: number;
    conversionRate: number;
  }[];
  topSalesperson: {
    id: string;
    name: string;
    sales: number;
  };
  salespersonProductGroups: {
    salespersonId: string;
    salespersonName: string;
    groups: {
      group: string;
      sales: number;
      quantity: number;
    }[];
  }[];
  salespersonProducts: {
    salespersonId: string;
    salespersonName: string;
    products: {
      productId: string;
      productName: string;
      sales: number;
      quantity: number;
    }[];
  }[];
  salespersonMonthlyTrend: {
    month: string;
    salespeople: {
      id: string;
      name: string;
      sales: number;
      orders: number;
    }[];
  }[];
}

export type ReportType = "CUSTOMER" | "EMPLOYEE";

export interface CustomerListItem {
  id: string;
  code: string;
  name: string;
  type: string;
  province: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  purchaseFrequency: number;
  lifetimeValue: number;
  lastPurchaseDate?: string;
}

export interface SalespersonListItem {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  customerCount: number;
  totalPoints: number;
  lastSaleDate?: string;
}
