export interface ShippingCompanyRecord {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: string;
  customerList?: Array<{
    id: string;
    name: string;
    customerCode: string;
  }>;
}

export interface ShippingCompanyPayload {
  name: string;
  phone?: string;
  address?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  notes?: string;
  status?: string;
  customerIds?: string[];
}

export interface ShippingCompaniesPagination {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}
