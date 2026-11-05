import type {
  Type14ImageFile,
  Type14PlotActualState,
  Type14ActualProductState,
  Type14WithdrawnProductLine,
  FollowUpPlanOption,
  DealerCustomerOption,
  ProductOption,
} from "../../shared/types";

export interface Type14UnplannedItem {
  id?: string;
  mode?: "EXISTING_PLOT" | "NEW_PLOT";
  selectedPlanId?: string | null;
  selectedPlotIds?: string[];
  type13TargetIds?: string[];
  plots?: Type14PlotActualState[];
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type14WithdrawnProductLine[];

  // Primary / Single plot fallback fields
  name?: string;
  plotName?: string;
  storeId?: string;
  dealerName?: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  areaRai?: number | string;
  treeCount?: number | string;
  province?: string;
  district?: string;
  subdistrict?: string;
  village?: string;
  latitude?: string;
  longitude?: string;
  plannedPlotsCount?: number | string;
  actualPlotsCount?: number | string;
  actualVisitDate?: string;
  daysAfterSpray?: string;
  trackingResult?: string;
  productResponse?: string;
  plotStatus?: "IN_PROGRESS" | "COMPLETED";
  closureNotes?: string;
  additionalNotes?: string;
  products?: Type14ActualProductState[];
  images?: Type14ImageFile[];
  afterSprayImages?: Type14ImageFile[];
}

export interface Type14UnplannedFormProps {
  item: Type14UnplannedItem;
  onChange: (updated: Type14UnplannedItem) => void;
  dealers?: DealerCustomerOption[];
  products?: ProductOption[];
  hattackFollowUpPlans?: FollowUpPlanOption[];
  readonly?: boolean;
  className?: string;
}

export interface Type14UnplannedValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}
