// =============================================================================
// TYPE 2: ติดตามผลการใช้สินค้า (Product Follow-up) - Public API Contract
// =============================================================================

// 🟢 โซน "ในแผน" (Planned Sub-slice)
export {
  Type2PlannedForm,
  Type2PlanForm,
  Type2Followup,
} from "./planned/components/type2-planned-form";
export { Type2PlanCard } from "./planned/components/type2-plan-card";
export {
  useType2PlannedForm,
  useType2Form,
  type UseType2PlannedFormOptions,
  type UseType2PlannedFormResult,
  type UseType2FormOptions,
  type UseType2FormResult,
} from "./planned/hooks/use-type2-planned-form";
export {
  validateType2FormItems,
  createType2ValidationSchema,
  type ValidateType2Options,
  type Type2ValidationResult,
} from "./planned/application/planned-validation";
export {
  extractType2PlanTargets,
  hydrateType2PlannedData,
} from "./planned/application/planned-mapper";
export { type2PlannedStrategy } from "./planned/infrastructure/type2-planned.strategy";
export type {
  Type2PlannedItem,
  Type2ProductFollowupItem,
  Type2FollowupProductLine,
  Type2TargetItem,
  Type2PlanCardTarget,
  Type2PlanCardTargetItem,
  Type2PlanCardProps,
  Type2PlannedFormProps,
  Type2PlanFormProps,
  Type2FollowupProps,
  Type2DetailViewProps,
  DetailType2FollowupProps,
  Type2ApprovalCardProps,
  ApprovalType2FollowupProps,
} from "./planned/types/planned.types";

// 🔵 โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type2ActualForm,
  ActualType2Followup,
} from "./planned/components/type2-actual-form";
export { useType2Actual } from "./planned/hooks/use-type2-actual";
export {
  Type2DetailView,
  DetailType2Followup,
} from "./planned/components/type2-detail-view";
export {
  Type2ApprovalCard,
  ApprovalType2Followup,
} from "./planned/components/type2-approval-card";
export {
  validateType2Actual,
  type ValidateType2ActualOptions,
  type Type2ActualValidationResult,
} from "./planned/application/actual-validation";
export {
  parseType2ActualResult,
  mapType2ActualFormToDb,
} from "./planned/application/actual-mapper";
export type {
  FollowupProductItem,
  Type2ActualFormProps,
  Type2ActualData,
} from "./planned/types/actual.types";

// 🟡 โซน "นอกแผน" (Unplanned Sub-slice)
export { Type2UnplannedForm } from "./unplanned/components/type2-unplanned-form";
export { useType2UnplannedForm } from "./unplanned/hooks/use-type2-unplanned-form";
export {
  validateType2UnplannedItem,
  type2UnplannedItemSchema,
  type ValidateType2UnplannedOptions,
  type Type2UnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType2UnplannedData,
  mapType2UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export { type2UnplannedStrategy } from "./unplanned/infrastructure/type2-unplanned.strategy";
export type {
  Type2UnplannedItem,
  Type2UnplannedProductItem,
  Type2UnplannedFormProps,
} from "./unplanned/types/unplanned.types";

// ⚪ ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 2 (Shared)
export {
  USAGE_RESULTS,
  USAGE_RESULT_CONFIG,
  type UsageResult,
} from "./shared/constants";
export type {
  CustomerOption,
  ProductOption,
  Type2ImageFile,
  ImageFile,
} from "./shared/types";
