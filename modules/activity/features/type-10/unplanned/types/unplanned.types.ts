import type {
  Type10ImageFile,
  Type10SoldProductItem,
  Type10ProductOption,
  Type10DemoPlotOption,
  FarmerFeedback,
} from "../../shared/types";

export interface Type10UnplannedItem {
  id: string;
  targetId?: string;
  demoPlotId?: string | null;
  plotName: string;
  farmerName?: string;
  location?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  cropCategory?: string;
  cropName?: string;
  showcaseProductId?: string | null;
  showcaseProduct?: string;
  expectedAttendees?: number | string;
  actualAttendees: number | string;
  targetBookingSales?: number | string;
  actualSalesOrBooking: number | string;
  farmerFeedback: FarmerFeedback | "";
  targetFarmersList?: string;
  summary?: string;
  soldProducts: Type10SoldProductItem[];
  notes?: string;
  images: Type10ImageFile[];
}

export interface Type10UnplannedFormProps {
  readonly?: boolean;
  items: Type10UnplannedItem[];
  demoPlots?: Type10DemoPlotOption[];
  products?: Type10ProductOption[];
  addItem?: () => void;
  updateItem: (
    id: string,
    field: keyof Type10UnplannedItem | string,
    value: any,
  ) => void;
  deleteItem?: (id: string) => void;
  addSoldProduct?: (itemId: string) => void;
  updateSoldProduct?: (
    itemId: string,
    prodId: string,
    field: keyof Type10SoldProductItem,
    value: any,
  ) => void;
  deleteSoldProduct?: (itemId: string, prodId: string) => void;
}

export interface Type10UnplannedValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface UseType10UnplannedFormOptions {
  initialItems?: Type10UnplannedItem[];
}

export interface UseType10UnplannedFormResult {
  items: Type10UnplannedItem[];
  addItem: () => void;
  updateItem: (
    id: string,
    field: keyof Type10UnplannedItem | string,
    value: any,
  ) => void;
  deleteItem: (id: string) => void;
  addSoldProduct: (itemId: string) => void;
  updateSoldProduct: (
    itemId: string,
    prodId: string,
    field: keyof Type10SoldProductItem,
    value: any,
  ) => void;
  deleteSoldProduct: (itemId: string, prodId: string) => void;
  validate: () => Type10UnplannedValidationResult;
  setItems: React.Dispatch<React.SetStateAction<Type10UnplannedItem[]>>;
}
