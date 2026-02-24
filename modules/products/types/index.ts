/**
 * Product Feature Types
 * Type definitions for product feature components
 */

// Core product types from shared types
export * from "@/types/product";

import { Product, ProductFormData } from "@/types/product";

export interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string;
  isEdit?: boolean;
  onSubmit?: (payload: any) => Promise<{
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
    data?: any;
  }>;
  onCancel?: () => void;
  hideBorder?: boolean;
  canEdit?: boolean;
  permissionHint?: string;
}

export interface ProductRecord extends Product {
  _count?: {
    freeItems: number;
    promotionItems: number;
    stockLots: number;
  };
  stockQuantity?: number;
  reserved?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  physicalQuantity?: number;
}

export type ProductsPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface ProductsTableProps {
  data: ProductRecord[];
  loading?: boolean;
  canCreate: boolean;
  canView?: boolean;
  canUpdate?: boolean;
  canDelete: boolean;
  canManage?: boolean;
  onDeleteRequest: (product: ProductRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  pagination: ProductsPagination;
}
