import type { TourType, TourSize, CustomerOption, Type12ImageFile } from "../../shared/types";

export interface Type12UnplannedItem {
  tourType: "STORE" | "CENTRAL";
  tourSize?: "LARGE" | "SMALL" | null;
  country?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  destination?: string | null;
  actualAttendees?: number;
  tourHighlights?: string;
  feedbackIssues?: string;
  images?: Type12ImageFile[];
}

export interface Type12UnplannedFormProps {
  item: Type12UnplannedItem;
  onChange: (updated: Type12UnplannedItem) => void;
  customers?: CustomerOption[];
  onUploadImages?: (files: File[]) => Promise<Type12ImageFile[]>;
  readonly?: boolean;
  className?: string;
}

export interface ValidateType12UnplannedParams {
  item: Type12UnplannedItem;
}

export interface Type12UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}
