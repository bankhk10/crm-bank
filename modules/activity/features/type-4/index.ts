// =============================================================================
// TYPE 4: วางบิล / เก็บเงิน (Billing & Payment Collection) - Public API Contract
// =============================================================================

// 🟢 โซน "ในแผน" (Planned Sub-slice)
export {
  Type4PlannedForm,
  Type4PlanForm,
  Type4Collect,
} from "./planned/components/type4-planned-form";
export { Type4PlanCard } from "./planned/components/type4-plan-card";
export {
  useType4PlannedForm,
  useType4Form,
  type UseType4PlannedFormOptions,
  type UseType4FormOptions,
  type UseType4PlannedFormResult,
  type UseType4FormResult,
} from "./planned/hooks/use-type4-planned-form";
export {
  validateType4FormItems,
  type4CollectItemSchema,
  type ValidateType4Options,
  type Type4ValidationResult,
} from "./planned/application/planned-validation";
export {
  extractType4PlanTargets,
  hydrateType4PlannedData,
  mapType4FormToPayload,
  mapType4ToSectionItems,
} from "./planned/application/planned-mapper";
export type {
  Type4CollectItem,
  TargetCollectCompanyItem,
  Type4TargetItem,
  Type4PlanCardTargetItem,
  Type4PlanCardTarget,
  Type4PlanCardProps,
  Type4PlannedFormProps,
  Type4PlanFormProps,
  Type4CollectProps,
} from "./planned/types/planned.types";

// 🔵 โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export { Type4ActualForm, ActualType4Collect } from "./planned/components/type4-actual-form";
export { useType4Actual } from "./planned/hooks/use-type4-actual";
export { Type4DetailView, DetailType4Collect } from "./planned/components/type4-detail-view";
export { Type4ApprovalCard, ApprovalType4Collect } from "./planned/components/type4-approval-card";
export {
  validateType4Actual,
  type4ActualSchema,
  type Type4ActualValidationResult,
} from "./planned/application/actual-validation";
export {
  parseType4ActualResult,
  mapType4ActualFormToDb,
} from "./planned/application/actual-mapper";
export type {
  Type4ActualData,
  Type4ActualFormProps,
  ActualType4CollectProps,
  Type4DetailViewProps,
  DetailType4CollectProps,
  Type4ApprovalCardProps,
  ApprovalType4CollectProps,
} from "./planned/types/actual.types";

// 🟡 โซน "นอกแผน" (Unplanned Sub-slice)
export { Type4UnplannedForm } from "./unplanned/components/type4-unplanned-form";
export { useType4UnplannedForm } from "./unplanned/hooks/use-type4-unplanned-form";
export {
  validateType4UnplannedForm,
  type4UnplannedItemSchema,
  type Type4UnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType4UnplannedData,
  mapType4UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export type {
  Type4UnplannedItem,
  Type4UnplannedFormProps,
  Type4UnplannedPayload,
} from "./unplanned/types/unplanned.types";

// ⚪ ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 4 (Shared)
export {
  COLLECT_TYPES,
  COLLECT_TYPE_LABELS,
  BILLING_STATUSES,
  BILLING_STATUS_CONFIG,
  type CollectType,
  type BillingStatus,
} from "./shared/constants";
export type {
  StoreOption,
  CustomerOption,
  Type4ImageFile,
  ImageFile,
} from "./shared/types";
