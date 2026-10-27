import type {
  Type13ImageFile,
  Type13SprayingProduct,
  DealerOption,
  ProductOption,
} from "../../shared/types";

export interface Type13UnplannedPlot {
  id: string;
  name?: string;
  plotName?: string;
  storeId: string;
  dealerName?: string;
  province: string;
  district: string;
  subdistrict?: string;
  village?: string;
  villageName?: string;
  actualPlotsCount?: number | string;
  latitude?: string;
  longitude?: string;
  sprayDate?: string;
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  sprayEquipment?: string;
  productResponse?: string;
  problemDetail?: string;
  notes?: string;
  products: Type13SprayingProduct[];
  images?: Type13ImageFile[];
  afterSprayImages?: Type13ImageFile[];
}

export type Type13UnplannedItem = Type13UnplannedPlot;

export interface Type13UnplannedFormProps {
  item: Type13UnplannedItem;
  onChange: (updated: Type13UnplannedItem) => void;
  dealers?: DealerOption[];
  products?: ProductOption[];
  readonly?: boolean;
  className?: string;
}

export interface Type13UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}
