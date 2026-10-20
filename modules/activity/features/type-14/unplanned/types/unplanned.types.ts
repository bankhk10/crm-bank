import type {
  Type14ImageFile,
  Type14ActualProductState,
  DealerCustomerOption,
  ProductOption,
} from "../../shared/types";

export interface Type14UnplannedItem {
  id?: string;
  name: string;
  plotName?: string;
  storeId: string;
  dealerName?: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  areaRai?: number | string;
  treeCount?: number | string;
  province: string;
  district: string;
  subdistrict?: string;
  village?: string;
  latitude: string;
  longitude: string;
  actualVisitDate: string;
  daysAfterSpray: string;
  trackingResult: string;
  productResponse: string;
  additionalNotes?: string;
  products: Type14ActualProductState[];
  images?: Type14ImageFile[];
}

export interface Type14UnplannedFormProps {
  item: Type14UnplannedItem;
  onChange: (updated: Type14UnplannedItem) => void;
  dealers?: DealerCustomerOption[];
  products?: ProductOption[];
  readonly?: boolean;
  className?: string;
}

export interface Type14UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}
