import {
  Sale,
  SaleItem,
  SaleStatus,
  PaymentTerm,
} from "@/src/infrastructure/database";

export type { Sale, SaleItem, SaleStatus, PaymentTerm };

// Extended types with relations
export interface SaleWithRelations extends Sale {
  customer: {
    id: string;
    name: string;
    customerCode: string;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
    addressLine?: string | null;
    subdistrict?: string | null;
    district?: string | null;
    province?: string | null;
    postalCode?: string | null;
    billingAddressLine?: string | null;
    billingSubdistrict?: string | null;
    billingDistrict?: string | null;
    billingProvince?: string | null;
    billingPostalCode?: string | null;
  };
  employee: {
    id: string;
    name: string;
    employeeCode?: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  items: SaleItemWithProduct[];
}

export interface SaleItemWithProduct extends SaleItem {
  product: {
    id: string;
    name: string;
    productCode: string;
    unit?: string | null;
    price?: number | null;
    packageSizePerBox?: string | null;
  };
}

// Form data types
export interface SaleFormData {
  customerId: string;
  employeeId: string;
  paymentTerm: PaymentTerm;
  creditDays?: number;
  creditDueDate?: string;
  usePromotionalCredit: boolean;
  promotionalCreditUsed?: number;
  saleDate: string;
  requestedDeliveryDate?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  pickupCompanyId?: string;
  selectedAddressId?: string;
  billingAddress?: string;
  shippingAddress?: string;
  useCustomShipping?: boolean; // Flag indicating user specified custom shipping address
  items: SaleItemFormData[];
  shippingCost: number;
  otherCosts: number;
  otherCostsDescription?: string;
  notes?: string;
}

export interface SaleItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  priceModified: boolean;
}

// API response types
export interface SalesListResponse {
  sales: SaleWithRelations[];
  total: number;
  page: number;
  perPage: number;
}

export interface SaleDetailResponse {
  sale: SaleWithRelations;
  stockWarnings: StockWarning[];
  priceWarnings: PriceWarning[];
  creditInfo: CreditInfo;
}

export interface StockWarning {
  productId: string;
  productName: string;
  productCode: string; // Added for display
  requested: number;
  available: number;
  reserved: number;
}

export interface PriceWarning {
  productId: string;
  productName: string;
  originalPrice: number;
  modifiedPrice: number;
  difference: number;
  percentageDiff: number;
}

export interface CreditInfo {
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  promotionalCredit?: number;
  promotionalCreditUsed?: number;
  promotionalCreditAvailable?: number;
  currentSaleAmount: number;
  willExceedLimit: boolean;
}

// Filter and search types
export interface SalesFilterParams {
  search?: string;
  status?: SaleStatus;
  customerId?: string;
  employeeId?: string;
  paymentTerm?: PaymentTerm;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

// Approval types
export interface ApprovalData {
  notes?: string;
}

export interface RejectionData {
  reason: string;
}

export interface PaymentConfirmationData {
  paymentDate: string;
  paymentNotes?: string;
  deliveryDate?: string;
  deliveryNotes?: string;
}

// Status labels in Thai
export const SaleStatusLabels: Record<SaleStatus, string> = {
  PENDING: "รอดำเนินการ",
  PENDING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  AWAITING_PAYMENT: "รอดำเนินการชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  AWAITING_DELIVERY: "รอดำเนินการจัดส่งสินค้า",
  DELIVERED: "ระหว่างขนส่ง",
  DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
  EXPIRED: "หมดอายุ",
  OVERDUE: "เลยกำหนด",
  WAITING_FOR_CORRECTION: "แก้ไข",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};

export const PaymentTermLabels: Record<PaymentTerm, string> = {
  CREDIT_90: "ส่งสินค้าก่อน (เครดิต 90 วัน)",
  CASH_7: "ชำระเงินสด (เครดิต 7 วัน)",
  PREPAID: "ชำระเงินก่อนส่งสินค้า (โอนเงินก่อนส่งสินค้า)",
  CREDIT_OVER_90: "ส่งสินค้าก่อน (เครดิตมากกว่า 90 วัน)",
};

// Status color helpers
export const getSaleStatusColor = (status: SaleStatus): string => {
  const colors: Record<SaleStatus, string> = {
    PENDING:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-100",
    PENDING_APPROVAL:
      "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100",
    APPROVED:
      "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-100",
    REJECTED:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-100",
    AWAITING_PAYMENT:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-100",
    PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100",
    AWAITING_DELIVERY:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-100",
    DELIVERED:
      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-100",
    DELIVERY_COMPLETED:
      "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-100",
    EXPIRED:
      "bg-gray-100 text-gray-600 ring-1 ring-gray-300 dark:bg-gray-800/50 dark:text-gray-300",
    OVERDUE:
      "bg-orange-100 text-orange-700 ring-1 ring-orange-300 dark:bg-orange-900/40 dark:text-orange-100",
    COMPLETED:
      "bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-900/40 dark:text-green-100",
    WAITING_FOR_CORRECTION:
      "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-100",
    CANCELLED:
      "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 ring-1 ring-gray-300";
};

export const getSaleStatusDotColor = (status: SaleStatus): string => {
  const dots: Record<SaleStatus, string> = {
    PENDING: "bg-amber-500",
    PENDING_APPROVAL: "bg-yellow-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    AWAITING_PAYMENT: "bg-orange-500",
    PAID: "bg-emerald-500",
    AWAITING_DELIVERY: "bg-blue-500",
    DELIVERED: "bg-indigo-500",
    DELIVERY_COMPLETED: "bg-cyan-500",
    EXPIRED: "bg-gray-400",
    OVERDUE: "bg-orange-500",
    COMPLETED: "bg-green-600",
    WAITING_FOR_CORRECTION: "bg-amber-500",
    CANCELLED: "bg-red-600",
  };
  return dots[status] || "bg-gray-400";
};
