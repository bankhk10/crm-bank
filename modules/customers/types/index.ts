/**
 * Customer Feature Module Types
 * Type definitions for customer components
 */

// ============ Customer Record Types ============

/**
 * Customer type enum
 */
export type CustomerType = "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";

/**
 * Customer status enum
 */
export type CustomerStatus = "ACTIVE" | "INACTIVE" | "PENDING";

/**
 * Customer record for table display
 */
export interface CustomerRecord {
  id: string;
  customerCode: string;
  customerType: CustomerType;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  parentDealerId?: string | null;
  createdById?: string;
  departmentId?: string;
}

// ============ Customer Form Types ============

/**
 * Customer form payload for API submission
 */
export type CustomerPayload = {
  customerCode: string;
  customerType: CustomerType;
  name: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  region?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  status?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  birthDate?: string;
  images?: any[];
  shippingAddresses?: {
    addressLine: string;
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
  }[];
  contacts?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  }[];
};

/**
 * Customer form submission result
 */
export type SubmitResult = {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
  data?: any;
};

/**
 * Customer form props interface
 */
export interface CustomerFormProps {
  initial?: Partial<CustomerPayload>;
  customerType?: CustomerType;
  onSubmit: (payload: CustomerPayload) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
  onSuccess?: () => void;
}

/**
 * Generic select option
 */
export interface SelectOption {
  value: string;
  label: string;
}

// ============ Customer Table Types ============

/**
 * Customers pagination interface
 */
export interface CustomersPagination {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}

/**
 * Customers table props interface
 */
export interface CustomersTableProps {
  data: CustomerRecord[];
  total: number;
  loading: boolean;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  filterDraft: {
    query: string;
    customerType?: string;
    status?: string;
  };
  setFilterDraft: React.Dispatch<React.SetStateAction<{
    query: string;
    customerType?: string;
    status?: string;
  }>>;
  onSearchSubmit: () => void;
  onRefresh?: () => void;
  // Permissions
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canEditItem?: (item: CustomerRecord) => boolean;
  canDeleteItem?: (item: CustomerRecord) => boolean;
  currentUserId?: string;
}

// ============ Customer Style Types ============

/**
 * Status style configuration
 */
export interface StatusStyle {
  label: string;
  className: string;
  dot: string;
}

/**
 * Customer type style configuration
 */
export interface CustomerTypeStyle {
  label: string;
  className: string;
  buttonColor: string;
}

// ============ Farm-related Types ============

/**
 * Farm plot data structure (for FARMER type)
 */
export interface FarmPlot {
  latitude?: string;
  longitude?: string;
  areaRai?: string;
  cropType?: string;
  variety?: string;
  soilType?: string;
  waterSource?: string;
}
