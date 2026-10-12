// ==========================================
// Types
// ==========================================
export type {
  Type14TrackingAttachment,
  Type14TrackingItem,
  Type14WithdrawnProductLine,
  Type14PlanInput,
  DealerCustomerOption,
  ProductOption,
  Type14PlanStorePayload,
  Type14ActualProductState,
  Type14ImageState,
  Type14SprayRoundState,
  Type14PlanCardProps,
  Type14CreateProps,
  Type14EditProps,
  Type14PlanFormProps,
  UseType14ActualStateResult,
  Type14ActualProps,
  Type14ActualFormProps,
  FormattedProduct,
  FormattedFollowUpRound,
  Type14DetailProps,
  Type14DetailViewProps,
  Type14ApprovalProps,
  Type14ApprovalCardProps,
  ValidateType14Params,
  ValidateType14Options,
  Type14ValidationResult,
  Type14ActualValidationInput,
} from "./types";

// ==========================================
// Application & Validation
// ==========================================
export {
  validateType14FormValues,
  validateType14Actual,
} from "./application/validation";

// ==========================================
// Components (Vertical Slice)
// ==========================================
export {
  Type14PlanCard,
} from "./components/type14-plan-card";

export {
  Type14PlanForm,
  Type14Create,
  Type14Edit,
} from "./components/type14-plan-form";

export {
  Type14ActualForm,
  Type14Actual,
} from "./components/type14-actual-form";

export {
  Type14DetailView,
  Type14Detail,
} from "./components/type14-detail-view";

export {
  Type14ApprovalCard,
  Type14Approval,
} from "./components/type14-approval-card";

// ==========================================
// Hooks
// ==========================================
export {
  useType14Form,
  type UseType14FormOptions,
  type UseType14FormResult,
} from "./hooks/use-type14-form";

export {
  useType14ActualState,
  useType14Actual,
} from "./hooks/use-type14-actual";
