/**
 * Product Feature Types
 * Type definitions for product feature components
 */

export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface Plant {
  id: string;
  code: string;
  name: string;
  abbreviation: string | null;
  group: string | null;
  recommendedMedicines: string | null;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

export interface PlantFormData {
  code: string;
  name: string;
  abbreviation?: string;
  group?: string;
  recommendedMedicines?: string;
  description?: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  description: string; // หมวดสินค้า
}

export interface ProductChain {
  id: string;
  name: string;
  description?: string | null; // รายละเอียดกรุ๊ปสินค้า
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  filename: string;
  order: number;
  createdAt: Date | string;
}

export interface ProductFreeItem {
  id: string;
  productId: string;
  purchaseQty: number;
  freeQty: number;
  netPrice: number | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductPromotionItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductStockLot {
  id: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  initialQuantity?: number;
  importDate: Date | string;
  expiryDate: Date | string | null;
  storageLocation: string | null;
  notes: string | null;
  isUsed: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  commonName: string | null;
  unit: string | null;
  productGroup: string | null; // กลุ่มชื่อการค้า (Trade Name Group)
  brand: string | null;
  chemicalGroup: string | null; // กลุ่มสินค้า (Product Group) - เดิมชื่อ "กลุ่มสาร"
  packageSize: string | null;
  packageSizePerBox: string | null;
  totalPackageSizePerBox: string | null;
  status: ProductStatus;
  usedForPlants: string[];
  salesPoint: string | null;
  properties: string | null;
  price: number | null;
  cartonPrice: number | null;
  promotionBudget: number | null;
  pointPerUnit: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // New fields
  categoryId: string | null; // FK to ProductCategory (หมวดสินค้า)
  productChainId: string | null; // FK to ProductChain (กรุ๊ปสินค้า)
  parentId: string | null; // FK to parent Product
  // Relations
  category?: ProductCategory | null;
  productChain?: ProductChain | null;
  parent?: Pick<Product, "id" | "productCode" | "name"> | null;
  images?: ProductImage[];
  promotionItems?: ProductPromotionItem[];
  freeItems?: ProductFreeItem[];
  stockLots?: ProductStockLot[];
  children?: Product[];
}

export interface ProductFormData {
  productCode: string;
  name: string;
  commonName?: string;
  unit?: string;
  productGroup?: string; // กลุ่มชื่อการค้า (Trade Name Group)
  brand?: string;
  chemicalGroup?: string; // กลุ่มสินค้า (Product Group) - เดิมชื่อ "กลุ่มสาร"
  packageSize?: string;
  packageSizePerBox?: string;
  totalPackageSizePerBox?: string;
  status: ProductStatus;
  usedForPlants: string[];
  salesPoint?: string;
  properties?: string;
  images?: Array<
    | File
    | {
        id?: string;
        url: string;
        name?: string;
        size?: number;
      }
  >;
  /** index in `images` that should be treated as the cover (0-based) */
  coverIndex?: number | null;
  // New fields
  categoryId?: string; // FK to ProductCategory (หมวดสินค้า)
  productChainId?: string; // FK to ProductChain (กรุ๊ปสินค้า)
  parentId?: string; // FK to parent Product
}

export interface ProductManagementFormData {
  price?: number;
  cartonPrice?: number;
  packageSizePerBox?: string;
  promotionBudget?: number;
  pointPerUnit?: number;
  freeItems: Array<{
    id?: string;
    purchaseQty: number;
    freeQty: number;
    netPrice?: number;
    notes?: string;
  }>;
  promotionItems: Array<{
    id?: string;
    name: string;
    quantity: number;
    price?: number;
    notes?: string;
  }>;
  stockLots: Array<{
    id?: string;
    lotNumber: string;
    quantity: number;
    initialQuantity?: number;
    importDate: Date | string;
    expiryDate?: Date | string;
    storageLocation?: string;
    notes?: string;
    isUsed?: boolean;
  }>;
}

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ใช้งาน" },
  { value: "INACTIVE", label: "ไม่ใช้งาน" },
];

export const STORAGE_LOCATION_OPTIONS = [
  { value: "คลังบางเลน", label: "คลังบางเลน" },
  // { value: "คลังบางเลน B", label: "คลังบางเลน B" },
];

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
  children?: ProductRecord[];
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
