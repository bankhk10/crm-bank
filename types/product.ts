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
  productGroup: string | null;
  brand: string | null;
  chemicalGroup: string | null;
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
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  images?: ProductImage[];
  promotionItems?: ProductPromotionItem[];
  freeItems?: ProductFreeItem[];
  stockLots?: ProductStockLot[];
}

export interface ProductFormData {
  productCode: string;
  name: string;
  commonName?: string;
  unit?: string;
  productGroup?: string;
  brand?: string;
  chemicalGroup?: string;
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
}

export interface ProductManagementFormData {
  price?: number;
  cartonPrice?: number;
  packageSizePerBox?: string;
  promotionBudget?: number;
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
