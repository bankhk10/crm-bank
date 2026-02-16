import type { DateRange } from "react-day-picker";

export interface CompanyRecord {
  id: string;
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  status?: string;
  createdAt?: string;
}

export interface CompanyPayload {
  name: string;
  companyCode?: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  status?: string;
}

export interface SubmitResult {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
}

export interface CompaniesPagination {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}

export interface CompaniesTableProps {
  data: CompanyRecord[];
  loading?: boolean;
  canCreate: boolean;
  canEdit?: boolean;
  canDelete: boolean;
  onDeleteRequest: (company: CompanyRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  pagination: CompaniesPagination;
}
