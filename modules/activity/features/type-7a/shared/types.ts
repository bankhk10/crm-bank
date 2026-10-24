import type { ImageFile } from "@/modules/activity/domain/summary/types";

export type { ImageFile };
export type Type7aImageFile = ImageFile;

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  responsibleEmployeeId?: string | null;
  phone?: string | null;
  telephone?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  categoryId?: string | null;
  productGroupId?: string | null;
  category?: {
    id: string;
    code: string;
    description?: string | null;
    name?: string | null;
  } | null;
  price?: number | null;
  unit?: string | null;
  packageSizeUnit?: string | null;
}

export interface ProductCategoryOption {
  id: string;
  code: string;
  description: string;
  name?: string;
}

export interface ChemicalGroupOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface Type7aDemoProductItem {
  id?: string;
  categoryId?: string | null;
  productId?: string;
  productName?: string;
  quantity?: number;
  targetQuantity?: number;
  unit?: string | null;
  applicationRate?: string | null;
  notes?: string | null;
  isAdditional?: boolean;
  plannedQuantity?: number | null;
  remainingQuantity?: number | null;
}

export interface Type7aPlotInput {
  id?: string;
  demoPlotId?: string | null;
  name?: string | null;
  plotName?: string | null;
  farmerName?: string | null;
  farmerCustomerId?: string | null;
  farmerPhone?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  storeId?: string | null;
  dealerName?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  customCropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  plantingDate?: Date | string | null;
  initialSprayDate?: Date | string | null;
  nextSprayDate?: Date | string | null;
  objective?: string | null;
  notes?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  categoryId?: string | null;
  chemicalGroupId?: string | null;
  hasProducts?: boolean;
  demoProducts?: Type7aDemoProductItem[];
  products?: Type7aDemoProductItem[];
}
