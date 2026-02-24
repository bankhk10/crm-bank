/**
 * Sale Form Types
 * Type definitions for sale form components
 */

import type {
  SaleFormData,
  SaleItemFormData,
  SaleWithRelations,
  SaleStatus,
} from "@/types/sales";
import type { DateRange } from "react-day-picker";

/**
 * Customer for sale form
 */
export interface SaleFormCustomer {
  id: string;
  name: string;
  customerCode: string;
  customerType: string;
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

/**
 * Employee for sale form
 */
export interface SaleFormEmployee {
  id: string;
  name: string;
  employeeCode?: string;
}

/**
 * Product for sale form
 */
export interface SaleFormProduct {
  id: string;
  name: string;
  productCode: string;
  price?: number;
  unit?: string;
  stockQuantity?: number;
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
  packageSizePerBox?: string;
}

/**
 * Company for sale form
 */
export interface SaleFormCompany {
  id: string;
  name: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
}

/**
 * Payment term type
 */
export type PaymentTermType =
  | "CREDIT_90"
  | "CASH_7"
  | "PREPAID"
  | "CREDIT_OVER_90";

/**
 * Delivery method type
 */
export type DeliveryMethodType =
  | "SALES_DELIVERY"
  | "FACTORY_DELIVERY"
  | "CUSTOMER_PICKUP"
  | "COURIER";

/**
 * Sale form props
 */
export interface SaleFormProps {
  initialData?: Partial<SaleFormData> & {
    id?: string;
    useCustomShipping?: boolean;
    deliveryMethod?: DeliveryMethodType;
    pickupCompanyId?: string;
    requestedDeliveryDate?: string;
    selectedAddressId?: string;
  };
  onSubmit: (data: SaleFormData) => Promise<void>;
  isEdit?: boolean;
  onCancel?: () => void;
}

/**
 * Sale form state
 */
export interface SaleFormState {
  customerId: string;
  employeeId: string;
  pickupCompanyId: string;
  paymentTerm: PaymentTermType;
  creditDays: number;
  creditDueDate: string;
  saleDate: string;
  usePromotionalCredit: boolean;
  promotionalCreditUsed: number;
  requestedDeliveryDate: string;
  deliveryDate: string;
  billingAddress: string;
  shippingAddress: string;
  useCustomShippingAddress: boolean;
  customShippingAddress: string;
  deliveryMethod: DeliveryMethodType;
  items: SaleItemFormData[];
  shippingCost: number;
  otherCosts: number;
  otherCostsDescription: string;
  notes: string;
}

/**
 * Sale form validation errors
 */
export interface SaleFormErrors {
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string>;
}

/**
 * Parsed address structure
 */
export interface ParsedAddress {
  street: string;
  thaiAddress: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
}

/**
 * Customer selector props
 */
export interface CustomerSelectorProps {
  customers: SaleFormCustomer[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Employee selector props
 */
export interface EmployeeSelectorProps {
  employees: SaleFormEmployee[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Payment term selector props
 */
export interface PaymentTermSelectorProps {
  value: PaymentTermType;
  onChange: (value: PaymentTermType) => void;
  isAdmin: boolean;
}

/**
 * Delivery method section props
 */
export interface DeliveryMethodSectionProps {
  value: DeliveryMethodType;
  onChange: (value: DeliveryMethodType) => void;
  customer?: SaleFormCustomer | null;
  selectedAddressId?: string;
  onAddressSelect?: (addressId: string, fullAddress: string) => void;
  onUseCustomAddress?: () => void;
  // Additional props for shipping address handling
  companies?: SaleFormCompany[];
  pickupCompanyId?: string;
  onPickupCompanyChange?: (value: string) => void;
  shippingCompanyId?: string;
  onShippingCompanyChange?: (value: string) => void;
  requestedDeliveryDate?: string;
  onRequestedDeliveryDateChange?: (value: string) => void;
  shippingAddress?: string;
  customShippingAddress?: string;
  useCustomShippingAddress?: boolean;
  onCustomShippingAddressChange?: (value: string) => void;
  onUseCustomShippingAddressChange?: (value: boolean) => void;
  fieldErrors?: Record<string, string>;
  onFieldErrorClear?: (field: string) => void;
}

/**
 * Sale item row props
 */
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

/**
 * Sale summary props
 */
export interface SaleSummaryProps {
  subtotal: number;
  shippingCost: number;
  otherCosts: number;
  total: number;
}

/**
 * Product detail modal props
 */
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
  // Callback functions to check per-item permissions based on access scope
  canEditItem?: (item: SaleRecord) => boolean;
  canDeleteItem?: (item: SaleRecord) => boolean;
}
