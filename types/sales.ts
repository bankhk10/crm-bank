import { Sale, SaleItem, SaleStatus, PaymentTerm } from "@prisma/client";

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
  billingAddress?: string;
  shippingAddress?: string;
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
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  AWAITING_PAYMENT: "รอดำเนินการชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  AWAITING_DELIVERY: "รอดำเนินการจัดส่งสินค้า",
  DELIVERED: "จัดส่งแล้ว",
  DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
  EXPIRED: "หมดอายุ",
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
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    AWAITING_PAYMENT: "bg-blue-100 text-blue-800",
    PAID: "bg-teal-100 text-teal-800",
    AWAITING_DELIVERY: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-purple-100 text-purple-800",
    DELIVERY_COMPLETED: "bg-cyan-100 text-cyan-800",
    EXPIRED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};
