import type {
  CustomerOption,
  ProductOption,
  Type7aDemoProductItem,
  Type7aImageFile,
} from "../../shared/types";

/**
 * Data structure for an unplanned Type 7A demo plot item
 * Combines plot establishment details, crop, GPS, demo products, and on-the-spot photos
 */
export interface Type7aUnplannedItem {
  id: string;
  demoPlotId?: string | null;

  // Plot Details
  plotName: string;
  farmerName: string;
  storeId?: string | null;
  province?: string;
  district?: string;
  cropCategory: string;
  cropName: string;
  customCropName?: string;
  areaRai?: number | null;
  objective?: string;
  plotObjective?: string;
  notes?: string;

  // GPS Coordinates
  latitude?: string | number | null;
  longitude?: string | number | null;

  // Demo Products
  demoProducts?: Type7aDemoProductItem[];

  // On-the-spot Establishment Photos
  initialPhotos?: Type7aImageFile[];
}

export interface Type7aUnplannedFormProps {
  readonly?: boolean;
  items: Type7aUnplannedItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type7aUnplannedItem, val: any) => void;
  deleteItem?: (id: string) => void;
  addProductToItem?: (itemId: string) => void;
  updateProductInItem?: (
    itemId: string,
    prodIndex: number,
    field: string,
    val: any,
  ) => void;
  deleteProductFromItem?: (itemId: string, prodIndex: number) => void;
}
