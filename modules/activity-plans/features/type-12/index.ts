// ==========================================
// Types
// ==========================================
export type {
  TourType,
  TourSize,
  CustomerOption,
  EditCustomerOption,
  Type12TourDataPayload,
  Type12TargetItem,
  Type12PlanTarget,
  Type12PlanItem,
  Type12PlanCardProps,
  Type12TourProps,
  Type12PlanFormProps,
  DetailType12TourProps,
  Type12DetailViewProps,
  ApprovalType12TourProps,
  Type12ApprovalCardProps,
  ValidateType12Params,
  ValidateType12Options,
  Type12ValidationResult,
} from "./types";

// ==========================================
// Application & Mappers & Validation
// ==========================================
export {
  extractType12PlanTargets,
  mapType12ToSectionItems,
} from "./application/mapper";

export {
  validateType12FormValues,
} from "./application/validation";

// ==========================================
// Components (Vertical Slice)
// ==========================================
export {
  Type12PlanCard,
} from "./components/type12-plan-card";

export {
  Type12PlanForm,
  Type12Tour,
  EditType12Tour,
} from "./components/type12-plan-form";

export {
  Type12DetailView,
  DetailType12Tour,
} from "./components/type12-detail-view";

export {
  Type12ApprovalCard,
  ApprovalType12Tour,
} from "./components/type12-approval-card";

// ==========================================
// Hooks
// ==========================================
export {
  useType12Form,
  type UseType12FormOptions,
  type UseType12FormResult,
} from "./hooks/use-type12-form";
