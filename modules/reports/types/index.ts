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
    isoDate: string;
    sales: number;
    orders: number;
  }[];
  monthlyData: {
    month: string;
    fullName: string;
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
    totalPackageSold: number;
    packageUnit: string;
    packageSizeUnit: string;
    totalVolumeLiters: number;
    childCount: number;
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
    totalPackageSold: number;
    packageUnit: string;
    packageSizeUnit: string;
    totalVolumeLiters: number;
    childCount: number;
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
  abcSales: {
    id: string;
    code: string;
    name: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    productCount: number;
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
    totalVolumeLiters: number;
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
    region: string;
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
    purchaseFrequency: number;
    lifetimeValue: number;
    lastPurchaseDate?: string;
    parentDealerId?: string | null;
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
    salesNoteAmount: number;
    salesNoteCount: number;
    invoiceAmount: number;
    invoiceCount: number;
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

export interface ExecutiveDashboardData {
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    growthPercentage: number;
  };
  monthlySales: {
    month: string;
    sales: number;
    orders: number;
  }[];
  topProducts: {
    name: string;
    sales: number;
    quantity: number;
  }[];
  topCustomers: {
    name: string;
    sales: number;
    orders: number;
  }[];
  topSalespersons: {
    name: string;
    sales: number;
    orders: number;
  }[];
  salesByRegion: {
    region: string;
    sales: number;
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

// ==========================================
// SALESPERSON DETAIL REPORT
// ==========================================

export interface SalespersonDetailReportData {
  employee: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    employeeCode: string | null;
    status: string | null;
    positionTitle: string | null;
    roleTitle: string | null;
    responsibilityArea: string | null;
    company: { name: string } | null;
    department: { name: string } | null;
    manager: { name: string } | null;
    province: string | null;
    district: string | null;
    subdistrict: string | null;
    addressLine: string | null;
    postalCode: string | null;
  };
  kpi: {
    yearTotalSales: number;
    yearOrderCount: number;
    yearCustomerCount: number;
    yearAvgOrderValue: number;
    monthTotalSales: number;
    monthOrderCount: number;
    monthCustomerCount: number;
    currentMonthTarget: number;
    achievementPercent: number;
    totalPoints: number;
    lastSaleDate: string | null;
  };
  monthlyPerformance: {
    month: string;
    monthShort: string;
    monthIndex: number;
    target: number;
    actual: number;
    achievementPercent: number;
    orders: number;
    customers: number;
  }[];
  productBreakdown: {
    productId: string;
    productCode: string;
    productName: string;
    brand: string;
    productGroup: string;
    quantity: number;
    revenue: number;
    contribution: number;
    orderCount: number;
  }[];
  customerBreakdown: {
    customerId: string;
    customerCode: string;
    customerName: string;
    customerType: string;
    province: string;
    region: string;
    status: string;
    isResponsible: boolean;
    orders: number;
    revenue: number;
    lastOrderDate: string;
  }[];
  salesStatusData: {
    status: string;
    statusLabel: string;
    count: number;
    amount: number;
  }[];
  pointHistory: {
    id: string;
    productName: string;
    productCode: string;
    saleNumber: string;
    saleDate: string;
    quantity: number;
    pointPerUnit: number;
    totalPoints: number;
    createdAt: string;
  }[];
  recentSales: {
    id: string;
    saleNumber: string;
    saleDate: string;
    saleDateRaw: string;
    status: string;
    statusLabel: string;
    totalAmount: number;
    customerName: string;
    customerCode: string;
    customerId: string;
  }[];
  responsibleCustomers: {
    id: string;
    customerCode: string;
    name: string;
    customerType: string;
    province: string;
    region: string;
    status: string;
  }[];
  currentYear: number;
}

// ==========================================
// MONTHLY SALES OVERVIEW
// ==========================================

export interface MonthlySalesOverviewData {
  year: number;
  months: {
    month: number;
    monthName: string;
    monthShort: string;
    totalSales: number;
    totalOrders: number;
    salesNoteAmount: number;
    salesNoteCount: number;
    invoiceAmount: number;
    invoiceCount: number;
  }[];
  totals: {
    totalSales: number;
    totalOrders: number;
    salesNoteAmount: number;
    salesNoteCount: number;
    invoiceAmount: number;
    invoiceCount: number;
  };
  currentMonthHighlight: {
    month: number;
    monthName: string;
    totalSales: number;
    salesNoteAmount: number;
    invoiceAmount: number;
  } | null;
}

