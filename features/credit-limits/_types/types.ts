export interface CreditLimit {
  id: string;
  limitAmount: number;
  usedAmount?: number;
  availableAmount?: number;
  promoAmount?: number;
}

export interface TemporaryCreditLimit {
  id: string;
  requestedAmount: number;
  status: string;
  expiryDate: Date | string;
}

export interface CustomerRecord {
  id: string;
  customerCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimits?: CreditLimit[];
  temporaryCreditLimits?: TemporaryCreditLimit[];
}

export interface CreditLimitPayload {
  customerId: string;
  limitAmount: number;
  promoAmount?: number;
  usedAmount?: number;
  availableAmount?: number;
  effectiveDate: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface SubmitResult {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
}

export interface CreditLimitPagination {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
  perPageOptions?: number[];
}

export interface CustomersCreditTableProps {
  data: CustomerRecord[];
  loading?: boolean;
  pagination?: CreditLimitPagination;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: any;
  onDateRangeChange?: (range: any) => void;
}
