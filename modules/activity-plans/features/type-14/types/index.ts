import type { FollowUpPlanOption } from "@/modules/activity-plans/constants";
import type { useType14ActualState } from "../hooks/use-type14-actual-state";

// ==========================================
// Domain & Plot Tracking Models
// ==========================================

export interface Type14TrackingAttachment {
  id?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Type14TrackingItem {
  id?: string;
  visitDate: string;
  daysSinceStart?: number;
  notes?: string;
  attachments?: Type14TrackingAttachment[];
}

export interface Type14WithdrawnProductLine {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unit?: string;
}

export interface Type14PlanInput {
  mode: "EXISTING_PLOT" | "NEW_PLOT";
  selectedPlanId?: string | null;
  demoPlotId?: string | null;
  selectedPlotIds?: string[];
  demoPlotIds?: string[];
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
  trackings?: Type14TrackingItem[];
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type14WithdrawnProductLine[];
}

export interface DealerCustomerOption {
  id: string;
  name: string;
  customerCode?: string;
  province?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
}

export interface Type14PlanStorePayload {
  workTypeCode: string;
  visitPurpose?: "FARMER" | "STORE" | null;
  storeId: string;
  storeName: string;
  province: string | null;
  remarks: string;
  notes: string;
}

export interface Type14ActualProductState {
  productId: string;
  productName: string;
  unit: string;
  quantityUsed: number | string;
  actualRate: string;
  detail: string;
}

export interface Type14ImageState {
  id: string;
  url: string;
  file?: File;
  name?: string;
  size?: number;
  type?: string;
}

export interface Type14SprayRoundState {
  id?: string;
  roundNumber: number; // 1, 2, 3...
  actualVisitDate: string;
  daysAfterSpray: string;
  trackingResult: string;
  additionalNotes: string;
  afterSprayImages: Type14ImageState[];
  products: Type14ActualProductState[];
}

// ==========================================
// Component Props
// ==========================================

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
}

export type Type14EditProps = Type14CreateProps;
export type Type14PlanFormProps = Type14CreateProps;

export type UseType14ActualStateResult = ReturnType<typeof useType14ActualState>;

export interface Type14ActualProps {
  isVisible?: boolean;
  actualState: UseType14ActualStateResult;
  products?: ProductOption[];
  readonly?: boolean;
  plan?: any;
}

export type Type14ActualFormProps = Type14ActualProps;

export interface FormattedProduct {
  productId: string;
  productName: string;
  quantityUsed: number | string;
  unit: string;
  actualRate: string;
  detail: string;
}

export interface FormattedFollowUpRound {
  id?: string;
  roundNumber: number;
  visitDate: any;
  daysSinceStart: number;
  productResponse: string;
  notes: string;
  products: FormattedProduct[];
  attachments: Array<{
    id?: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

export interface Type14DetailProps {
  data?: Type14PlanInput;
  plots?: any[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  plan?: any;
}

export type Type14DetailViewProps = Type14DetailProps;

export interface Type14ApprovalProps {
  data?: Type14PlanInput;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}

export type Type14ApprovalCardProps = Type14ApprovalProps;

// ==========================================
// Validation Types
// ==========================================

export interface ValidateType14Params {
  selectedWorkTypes: string[];
  type14Data: Type14PlanInput;
}

export type ValidateType14Options = ValidateType14Params;

export interface Type14ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Type14ActualValidationInput {
  demoPlotId?: string;
  rounds?: Type14SprayRoundState[];
}
