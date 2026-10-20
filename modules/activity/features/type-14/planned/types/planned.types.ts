import type {
  Type14PlotItem,
  Type14TargetItem,
  Type14WithdrawnProductLine,
  FollowUpPlanOption,
  DealerCustomerOption,
  ProductOption,
} from "../../shared/types";

export type {
  Type14PlotItem,
  Type14TargetItem,
  FollowUpPlanOption,
  DealerCustomerOption,
  ProductOption,
};

export interface Type14PlanInput {
  mode: "EXISTING_PLOT" | "NEW_PLOT";
  selectedPlanId?: string | null;
  demoPlotId?: string | null;
  selectedPlotIds?: string[];
  demoPlotIds?: string[];
  plots?: Type14PlotItem[];
  name?: string;
  storeId?: string;
  dealerName?: string | null;
  ownerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  province?: string;
  district?: string;
  latitude?: string | null;
  longitude?: string | null;
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type14WithdrawnProductLine[];
  notes?: string | null;
}

export type Type14PlanTarget = Type14TargetItem;

export interface Type14PlanStorePayload {
  workTypeCode: string;
  visitPurpose?: "FARMER" | "STORE" | null;
  storeId: string;
  storeName: string;
  province: string | null;
  remarks: string;
  notes: string;
}

export interface Type14PlanCardProps {
  data?: Type14PlanInput;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  planType?: string;
  className?: string;
}

export interface Type14CreateProps {
  value: Type14PlanInput;
  onChange: (val: Type14PlanInput) => void;
  hattackFollowUpPlans?: FollowUpPlanOption[];
  dealerCustomers?: DealerCustomerOption[];
  products?: ProductOption[];
  planDate?: string;
  defaultProvince?: string;
  defaultDistrict?: string;
  readonly?: boolean;
  className?: string;
}

export type Type14EditProps = Type14CreateProps;
export type Type14PlanFormProps = Type14CreateProps;

export interface ValidateType14Params {
  selectedWorkTypes: string[];
  type14Data: Type14PlanInput;
}

export interface Type14ValidationResult {
  isValid: boolean;
  error?: string;
}
