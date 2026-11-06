// ==========================================
// 1. Shared Constants, Types & Notes
// ==========================================
export {
  WORK_TYPE_CODE as TYPE12_WORK_TYPE_CODE,
  WORK_TYPE_NAME as TYPE12_WORK_TYPE_NAME,
  TOUR_TYPE_OPTIONS,
  TOUR_SIZE_OPTIONS,
} from "./shared/constants";

export type {
  TourType,
  TourSize,
  CustomerOption,
  EditCustomerOption,
  Type12ImageFile,
  Type12TourRecord,
} from "./shared/types";

export {
  formatType12PlannedNotes,
  formatType12ActualSummary,
} from "./shared/notes";

// ==========================================
// 2. Planned Mode Artifacts
// ==========================================
export type {
  Type12TargetItem,
  Type12PlanTarget,
  Type12PlanItem,
  Type12TourDataPayload,
  Type12PlanCardProps,
  Type12TourProps,
  Type12PlanFormProps,
  ValidateType12Params,
  ValidateType12Options,
  Type12ValidationResult,
} from "./planned/types/planned.types";

export type {
  Type12ActualRecord,
  Type12ActualFormProps,
  Type12DetailViewProps,
  DetailType12TourProps,
  Type12ApprovalCardProps,
  ApprovalType12TourProps,
} from "./planned/types/actual.types";

export { validateType12FormValues } from "./planned/application/planned-validation";
export {
  extractType12PlanTargets,
  hydrateType12PlannedData,
  mapType12ToSectionItems,
} from "./planned/application/planned-mapper";
export { validateType12Actual } from "./planned/application/actual-validation";
export { parseType12ActualResult } from "./planned/application/actual-mapper";

export {
  useType12PlannedForm,
  useType12Form,
} from "./planned/hooks/use-type12-planned-form";
export type {
  UseType12PlannedFormOptions,
  UseType12PlannedFormResult,
} from "./planned/hooks/use-type12-planned-form";

export {
  useType12Actual,
} from "./planned/hooks/use-type12-actual";
export type {
  UseType12ActualOptions,
  UseType12ActualResult,
} from "./planned/hooks/use-type12-actual";

export {
  Type12PlannedForm,
  Type12PlanForm,
  Type12Tour,
  EditType12Tour,
} from "./planned/components/type12-planned-form";

export { Type12PlanCard } from "./planned/components/type12-plan-card";

export {
  Type12ActualForm,
  ActualType12Tour,
  ActualType12TourForm,
} from "./planned/components/type12-actual-form";

export {
  Type12DetailView,
  DetailType12Tour,
} from "./planned/components/type12-detail-view";

export {
  Type12ApprovalCard,
  ApprovalType12Tour,
} from "./planned/components/type12-approval-card";

// ==========================================
// 3. Unplanned Mode Artifacts
// ==========================================
export type {
  Type12UnplannedItem,
  Type12UnplannedFormProps,
  ValidateType12UnplannedParams,
  Type12UnplannedValidationResult,
} from "./unplanned/types/unplanned.types";

export { validateType12UnplannedItem } from "./unplanned/application/unplanned-validation";
export {
  hydrateType12UnplannedData,
  mapType12UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";

export { useType12UnplannedForm } from "./unplanned/hooks/use-type12-unplanned-form";
export type { UseType12UnplannedFormOptions } from "./unplanned/hooks/use-type12-unplanned-form";

export { Type12UnplannedForm } from "./unplanned/components/type12-unplanned-form";
