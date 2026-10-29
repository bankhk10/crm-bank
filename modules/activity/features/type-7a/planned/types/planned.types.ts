import type {
  CustomerOption,
  ProductOption,
  ProductCategoryOption,
  Type7aDemoProductItem,
} from "../../shared/types";

export interface Type7aPlanItem {
  id: string;
  code?: string | null;
  status?: string | null;
  demoPlotId?: string | null;
  plotName: string;
  name?: string;
  farmerName?: string;
  ownerName?: string;
  ownerPhone?: string;
  farmerPhone?: string;
  storeId?: string | null;
  dealerName?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  areaRai?: number | null;
  treeCount?: number | null;
  plantingDate?: string | null;
  initialSprayDate?: string | null;
  nextSprayDate?: string | null;
  objective?: string;
  notes?: string;
  categoryId?: string | null;
  chemicalGroupId?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  hasProducts?: boolean;
  demoProducts?: Type7aDemoProductItem[];
  products?: Type7aDemoProductItem[];
}

export interface Type7aTargetItem {
  id?: string;
  plotName?: string;
  name?: string;
  owner?: string;
  ownerName?: string;
  farmerName?: string;
  ownerPhone?: string;
  farmerPhone?: string;
  storeId?: string;
  dealerName?: string;
  dealerCode?: string;
  location?: string;
  province?: string;
  district?: string;
  objective?: string;
  cropCategory?: string;
  crop?: string;
  cropName?: string;
  customCropName?: string;
  areaRai?: number | string | null;
  treeCount?: number | string | null;
  plantingDate?: string | null;
  demoProducts?: Array<{
    productId?: string;
    productName?: string;
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  products?: Array<{
    productId?: string;
    productName?: string;
    quantity?: number | string;
    unit?: string | null;
  }>;
  [key: string]: any;
}

export interface Type7aPlannedFormProps {
  readonly?: boolean;
  type7aPlots: Type7aPlanItem[];
  addType7aRow: () => void;
  updateType7aRow: (id: string, field: keyof Type7aPlanItem, val: any) => void;
  deleteType7aRow: (id: string) => void;
  addProductToDemoPlot?: (plotId: string) => void;
  updateProductInDemoPlot?: (
    plotId: string,
    prodIndex: number,
    field: string,
    val: any,
  ) => void;
  deleteProductFromDemoPlot?: (plotId: string, prodIndex: number) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
  productCategories?: ProductCategoryOption[];
}

export type Type7aPlanFormProps = Type7aPlannedFormProps;
export type Type7NewDemoProps = Type7aPlannedFormProps;

export interface Type7aPlanCardTarget {
  id?: string;
  plotName?: string;
  name?: string;
  farmerName?: string;
  ownerName?: string;
  ownerPhone?: string;
  farmerPhone?: string;
  cropName?: string;
  cropCategory?: string;
  areaRai?: number | string | null;
  province?: string;
  district?: string;
  objective?: string;
  demoProducts?: Array<{
    productName?: string;
    quantity?: number | string;
    unit?: string;
  }>;
}

export interface Type7aPlanCardProps {
  targets: Type7aPlanCardTarget[];
  className?: string;
}

export interface ValidateType7aOptions {
  checkProducts?: boolean;
}

export interface Type7aValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}
