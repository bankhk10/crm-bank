/**
 * Sale Types
 * Combined core and UI/Form type definitions for the Sales module
 */

import { Sale, SaleItem, SaleStatus, PaymentTerm } from "@/lib/db";
import type { DateRange } from "react-day-picker";

export type { Sale, SaleItem, SaleStatus, PaymentTerm };

// --- Core Data Types (formerly types/sales.ts) ---

export interface SaleWithRelations extends Sale {
  customer: {
    id: string;
    name: string;
    customerCode: string;
    customerType?: string | null;
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
  budgetDetails?: Array<{
    id: string;
    type: string;
    amount: number;
    transactionDate: string | Date;
    description?: string | null;
  }>;
  saleAddress?: {
    companyAddressId?: string | null;
    billingCustomerAddressId?: string | null;
    shippingCustomerAddressId?: string | null;
    shippingCompanyAddressId?: string | null;
  } | null;
  shipments?: Array<{
    id: string;
    dueDate: Date | null;
    paymentDate: Date | null;
    actualDate: Date | null;
    scheduledDate: Date | null;
    salesOrderNumber: string | null;
    status: string;
    createdAt: Date;
  }>;
}

export interface SaleItemWithProduct extends SaleItem {
  product: {
    id: string;
    name: string;
    productCode: string;
    unit?: string | null;
    price?: number | null;
    packageSize?: number | string | null;
    packageSizeUnit?: string | null;
    packageSizePerBox?: number | string | null;
    freeItems?: Array<{
      id: string;
      purchaseQty: number;
      freeQty: number;
      netPrice?: number;
      notes?: string;
    }>;
    promotionItems?: Array<{
      id: string;
      name: string;
      quantity: number;
      price?: number;
      notes?: string;
    }>;
  };
}

export interface SaleFormData {
  customerId: string;
  employeeId: string;
  paymentTerm: PaymentTerm;
  creditDays?: number;
  creditDueDate?: string | null;
  usePromotionalCredit: boolean;
  promotionalCreditUsed?: number;
  saleDate: string;
  requestedDeliveryDate?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  pickupCompanyId?: string;
  shippingCompanyId?: string;
  selectedAddressId?: string;
  billingAddress?: string;
  shippingAddress?: string;
  useCustomShipping?: boolean;

  // New Reference Address IDs
  companyAddressId?: string;
  billingCustomerAddressId?: string;
  shippingCustomerAddressId?: string;
  pickupCompanyAddressId?: string;
  shippingCompanyAddressId?: string;

  // Company Address Exploded
  company_name?: string | null;
  company_phone?: string | null;
  address_line?: string | null;
  address_province?: string | null;
  address_district?: string | null;
  address_subdistrict?: string | null;
  address_code?: string | null;
  company_note?: string | null;

  // Billing Address Exploded
  billing_address_line?: string | null;
  billing_province?: string | null;
  billing_district?: string | null;
  billing_subdistrict?: string | null;
  billing_postal_code?: string | null;
  billing_note?: string | null;

  // Shipping Address Exploded
  shipping_address_line?: string | null;
  shipping_province?: string | null;
  shipping_district?: string | null;
  shipping_subdistrict?: string | null;
  shipping_postal_code?: string | null;
  shipping_note?: string | null;

  // Receiving Address (Pickup) Exploded
  receiving_name?: string | null;
  receiving_phone?: string | null;
  receiving_address_line?: string | null;
  receiving_province?: string | null;
  receiving_district?: string | null;
  receiving_subdistrict?: string | null;
  receiving_postal_code?: string | null;
  receiving_note?: string | null;

  // Sender Address (Shipping Company) Exploded
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_line?: string | null;
  sender_province?: string | null;
  sender_district?: string | null;
  sender_subdistrict?: string | null;
  sender_postal_code?: string | null;
  sender_note?: string | null;

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
  promotionBudget?: number | null;
}

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
  productCode: string;
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

export interface SalesFilterParams {
  search?: string;
  status?: SaleStatus;
  customerId?: string | string[];
  employeeId?: string;
  paymentTerm?: PaymentTerm;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

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

export const SaleStatusLabels: Record<SaleStatus, string> = {
  PENDING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  PAID: "ชำระเงินแล้ว",
  AWAITING_DELIVERY: "รอดำเนินการจัดส่งสินค้า",
  DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
  PARTIALLY_DELIVERED: "ส่งบางส่วนแล้ว",
  OVERDUE: "เลยกำหนดครบชำระ",
  WAITING_FOR_CORRECTION: "ส่งกลับให้แก้ไข",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};

export const PaymentTermLabels: Record<PaymentTerm, string> = {
  CREDIT_90: "ส่งสินค้าก่อน (เครดิต 90 วัน)",
  CASH_7: "ชำระเงินสด ไม่ลด (เครดิต 7 วัน )",
  CASH_DISCOUNT_3_7: "ชำระเงินสด ลด 3% (เครดิต 7 วัน)",
  PREPAID: "ชำระเงินก่อนส่งสินค้า (โอนเงินก่อนส่งสินค้า)",
  CREDIT_OVER_90: "ส่งสินค้าก่อน (เครดิตมากกว่า 90 วัน)",
};

export const getSaleStatusColor = (status: SaleStatus): string => {
  const colors: Record<SaleStatus, string> = {
    PENDING_APPROVAL:
      "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100",
    APPROVED:
      "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-100",
    REJECTED:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-100",
    PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100",
    AWAITING_DELIVERY:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-100",
    DELIVERY_COMPLETED:
      "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-100",
    PARTIALLY_DELIVERED:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-100",
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
    PENDING_APPROVAL: "bg-yellow-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    PAID: "bg-emerald-500",
    AWAITING_DELIVERY: "bg-blue-500",
    DELIVERY_COMPLETED: "bg-cyan-500",
    PARTIALLY_DELIVERED: "bg-purple-500",
    OVERDUE: "bg-orange-500",
    COMPLETED: "bg-green-600",
    WAITING_FOR_CORRECTION: "bg-amber-500",
    CANCELLED: "bg-red-600",
  };
  return dots[status] || "bg-gray-400";
};

// --- UI / Form Specific Types (from modules/sales/types/index.ts) ---

export interface OrderExpiryInfo {
  isLocked: boolean;
  expiresIn: number | null;
  remainingUpdates: number;
  warningLevel: "none" | "warning" | "critical";
}

export interface DeliveryDateUpdateResult {
  success: boolean;
  error?: string;
  isFirstDeliveryDate?: boolean;
  newUpdateCount?: number;
}

export interface OrderCheckResult {
  processed: number;
  errors: string[];
}

export const IMMUTABLE_STATUSES: SaleStatus[] = [
  "DELIVERY_COMPLETED",
  "COMPLETED",
  "CANCELLED",
  "OVERDUE",
];

export const CREDIT_PAYMENT_TERMS: PaymentTerm[] = [
  "CREDIT_90",
  "CREDIT_OVER_90",
  "CASH_7",
  "CASH_DISCOUNT_3_7",
];

export function isImmutableStatus(status: SaleStatus): boolean {
  return IMMUTABLE_STATUSES.includes(status);
}

export function isCreditPaymentTerm(term: PaymentTerm): boolean {
  return CREDIT_PAYMENT_TERMS.includes(term);
}

export interface SaleFormCustomer {
  id: string;
  name: string;
  customerCode: string;
  customerType: string;
  responsibleEmployeeId?: string | null;
  billingAddress?: string;
  shippingAddress?: string;
  shippingAddressLine?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingSubdistrict?: string;
  shippingPostalCode?: string;
  creditLimits?: Array<{
    id: string;
    limitAmount: number;
    promoAmount?: number;
    usedAmount: number;
    availableAmount: number;
    status: string;
    temporaryCreditAmount?: number;
    temporaryCreditExpiryDate?: string | Date | null;
  }>;
  shippingCompanies?: Array<{
    shippingCompany: {
      id: string;
      name: string;
      address?: string | null;
      addressLine?: string | null;
      subdistrict?: string | null;
      district?: string | null;
      province?: string | null;
      postalCode?: string | null;
    };
  }>;
  addresses?: Array<{
    id: string;
    addressLine?: string | null;
    province?: string | null;
    district?: string | null;
    subdistrict?: string | null;
    postalCode?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  subDealers?: Array<{
    id: string;
    name: string;
    customerCode: string;
    shippingAddressLine?: string | null;
    shippingProvince?: string | null;
    shippingDistrict?: string | null;
    shippingSubdistrict?: string | null;
    shippingPostalCode?: string | null;
    addresses?: Array<{
      id: string;
      addressLine?: string | null;
      province?: string | null;
      district?: string | null;
      subdistrict?: string | null;
      postalCode?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
}

export interface SaleFormEmployee {
  id: string;
  name: string;
  employeeCode?: string;
}

export interface SaleFormProduct {
  id: string;
  name: string;
  productCode: string;
  price?: number;
  unit?: string;
  stockQuantity?: number;
  promotionBudget?: number | null;
  promotionItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    price?: number;
    notes?: string;
  }>;
  freeItems?: Array<{
    id: string;
    purchaseQty: number;
    freeQty: number;
    netPrice?: number;
    notes?: string;
  }>;
  cartonPrice?: number;
  packageSizePerBox?: number | string;
  packageSize?: number | string;
  packageSizeUnit?: string;
}

export interface SaleFormCompany {
  id: string;
  name: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
}

export type PaymentTermType =
  | "CREDIT_90"
  | "CASH_7"
  | "CASH_DISCOUNT_3_7"
  | "PREPAID"
  | "CREDIT_OVER_90";

export type DeliveryMethodType =
  | "SALES_DELIVERY"
  | "FACTORY_DELIVERY"
  | "CUSTOMER_PICKUP"
  | "COURIER";

export interface SaleFormProps {
  initialData?: Partial<SaleFormData> & {
    id?: string;
    useCustomShipping?: boolean;
    deliveryMethod?: DeliveryMethodType;
    pickupCompanyId?: string;
    shippingCompanyId?: string;
    requestedDeliveryDate?: string;
    selectedAddressId?: string;
  };
  onSubmit: (data: SaleFormData) => Promise<void>;
  isEdit?: boolean;
  onCancel?: () => void;
}

export interface SaleFormState {
  customerId: string;
  employeeId: string;
  pickupCompanyId: string;
  shippingCompanyId: string;
  paymentTerm: PaymentTermType;
  creditDays: number;
  creditDueDate: string | null;
  saleDate: string;
  usePromotionalCredit: boolean;
  promotionalCreditUsed: number;
  requestedDeliveryDate: string;
  deliveryDate: string;
  billingAddress: string;
  shippingAddress: string;
  customShippingAddress: string;
  deliveryMethod: DeliveryMethodType;
  items: SaleItemFormData[];
  shippingCost: number;
  otherCosts: number;
  otherCostsDescription: string;
  notes: string;
}

export interface SaleFormErrors {
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string>;
}

export interface ParsedAddress {
  street: string;
  thaiAddress: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
}

export interface CustomerSelectorProps {
  customers: SaleFormCustomer[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export interface EmployeeSelectorProps {
  employees: SaleFormEmployee[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export interface PaymentTermSelectorProps {
  value: PaymentTermType;
  onChange: (value: PaymentTermType) => void;
  isAdmin: boolean;
}

export interface DeliveryMethodSectionProps {
  value: DeliveryMethodType;
  onChange: (value: DeliveryMethodType) => void;
  customer?: SaleFormCustomer | null;
  selectedAddressId?: string;
  onAddressSelect?: (addressId: string, fullAddress: string) => void;
  onUseCustomAddress?: () => void;
  companies?: SaleFormCompany[];
  pickupCompanyId?: string;
  onPickupCompanyChange?: (value: string) => void;
  shippingCompanyId?: string;
  onShippingCompanyChange?: (value: string) => void;
  requestedDeliveryDate?: string;
  onRequestedDeliveryDateChange?: (value: string) => void;
  shippingAddress?: string;
  customShippingAddress?: string;
  onCustomShippingAddressChange?: (value: string) => void;
  fieldErrors?: Record<string, string>;
  onFieldErrorClear?: (field: string) => void;
}

export interface SaleItemRowProps {
  item: SaleItemFormData;
  index: number;
  products: SaleFormProduct[];
  onUpdate: (
    index: number,
    field: keyof SaleItemFormData,
    value: unknown,
  ) => void;
  onRemove: (index: number) => void;
  onShowDetails: (product: SaleFormProduct) => void;
  fieldError?: string;
  onClearError?: () => void;
}

export interface SaleSummaryProps {
  subtotal: number;
  shippingCost: number;
  otherCosts: number;
  total: number;
  promotionalBudgetTotal?: number;
}

export interface ProductDetailModalProps {
  product: SaleFormProduct | null;
  onClose: () => void;
}

// --- Table Types ---

export type SaleRecord = SaleWithRelations;

export interface SalesTableProps {
  sales: SaleRecord[];
  total: number;
  page: number;
  perPage: number;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  statusFilter?: SaleStatus;
  onStatusFilterChange?: (status: SaleStatus | undefined) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onDelete?: (sale: SaleRecord) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  currentUserId?: string;
  userDepartmentId?: string | null;
  canEditItem?: (item: SaleRecord) => boolean;
  canDeleteItem?: (item: SaleRecord) => boolean;
  customerId?: string | string[];
  onCustomerIdChange?: (value: string | string[]) => void;
  customers?: any[];
}
