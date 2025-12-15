export type ProductStatus = "ACTIVE" | "INACTIVE";

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
  packageSize: string | null;
  packageSizePerBox: string | null;
  status: ProductStatus;
  usedForPlants: string[];
  salesPoint: string | null;
  properties: string | null;
  price: number | null;
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
  packageSize?: string;
  packageSizePerBox?: string;
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
    importDate: Date | string;
    expiryDate?: Date | string;
    storageLocation?: string;
    notes?: string;
    isUsed?: boolean;
  }>;
}

export const UNIT_OPTIONS = [
  { value: "ชิ้น", label: "ชิ้น" },
  { value: "กล่อง", label: "กล่อง" },
  { value: "ถุง", label: "ถุง" },
];

export const PRODUCT_GROUP_OPTIONS = [
  { value: "กลุ่ม A", label: "กลุ่ม A" },
  { value: "กลุ่ม B", label: "กลุ่ม B" },
  { value: "กลุ่ม C", label: "กลุ่ม C" },
];

export const BRAND_OPTIONS = [
  { value: "แบรนด์ X", label: "แบรนด์ X" },
  { value: "แบรนด์ Y", label: "แบรนด์ Y" },
  { value: "แบรนด์ Z", label: "แบรนด์ Z" },
];

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ใช้งาน" },
  { value: "INACTIVE", label: "ไม่ใช้งาน" },
];

export const PLANT_OPTIONS = [
  { value: "ยางพารา", label: "ยางพารา" },
  { value: "ข้าวโพดเลี้ยงสัตว์", label: "ข้าวโพดเลี้ยงสัตว์" },
  { value: "ทุเรียน", label: "ทุเรียน" },
  { value: "มังคุด", label: "มังคุด" },
  { value: "ลำไย", label: "ลำไย" },
  { value: "สับปะรด", label: "สับปะรด" },
  { value: "มะพร้าว", label: "มะพร้าว" },
  { value: "เงาะ", label: "เงาะ" },
  { value: "ลิ้นจี่", label: "ลิ้นจี่" },
  { value: "ลองกอง", label: "ลองกอง" },
  { value: "กาแฟ", label: "กาแฟ" },
  { value: "ส้มโอ", label: "ส้มโอ" },
  { value: "ส้มเขียวหวาน", label: "ส้มเขียวหวาน" },
  { value: "ถั่วเหลือง", label: "ถั่วเหลือง" },
  { value: "กระเทียม", label: "กระเทียม" },
  { value: "หอมแดง", label: "หอมแดง" },
  { value: "หอมหัวใหญ่", label: "หอมหัวใหญ่" },
  { value: "มะม่วง", label: "มะม่วง" },
  { value: "มะนาว", label: "มะนาว" },
  { value: "พริก", label: "พริก" },
];

export const STORAGE_LOCATION_OPTIONS = [
  { value: "คลังบางเลน A", label: "คลังบางเลน A" },
  { value: "คลังบางเลน B", label: "คลังบางเลน B" },
];
