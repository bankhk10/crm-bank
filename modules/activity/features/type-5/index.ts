// =============================================================================
// TYPE 5: สำรวจตลาดของคู่แข่ง (Competitor Market Survey) - Public API Contract
// =============================================================================

// 🟢 โซน "ในแผน" (Planned Sub-slice)
export {
  Type5PlannedForm,
  Type5PlanForm,
  Type5Survey,
  EditType5Survey,
} from "./planned/components/type5-planned-form";
export { Type5PlanCard } from "./planned/components/type5-plan-card";
export {
  useType5PlannedForm,
  useType5Form,
  type UseType5PlannedFormOptions,
  type UseType5FormOptions,
  type UseType5PlannedFormResult,
  type UseType5FormResult,
} from "./planned/hooks/use-type5-planned-form";
export {
  validateType5FormItems,
  type5SurveyItemSchema,
} from "./planned/application/planned-validation";
export {
  extractType5PlanTargets,
  hydrateType5PlannedData,
  mapType5FormToPayload,
  mapType5ToSectionItems,
} from "./planned/application/planned-mapper";
export { type5PlannedStrategy } from "./planned/infrastructure/type5-planned.strategy";
export type {
  Type5SurveyItem,
  TargetSurveyItem,
  Type5TargetItem,
  Type5PlanCardTargetItem,
  Type5PlanCardTarget,
  Type5PlanCardProps,
  Type5PlannedFormProps,
  Type5PlanFormProps,
  Type5SurveyProps,
  EditType5SurveyProps,
  ValidateType5Options,
  Type5ValidationResult,
} from "./planned/types/planned.types";

// 🔵 โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type5ActualForm,
  ActualType5Survey,
} from "./planned/components/type5-actual-form";
export { useType5Actual } from "./planned/hooks/use-type5-actual";
export {
  Type5DetailView,
  DetailType5Survey,
} from "./planned/components/type5-detail-view";
export {
  Type5ApprovalCard,
  ApprovalType5Survey,
} from "./planned/components/type5-approval-card";
export {
  validateType5Actual,
  type5SurveyRecordSchema,
  type Type5ActualValidationResult,
} from "./planned/application/actual-validation";
export { parseType5ActualResult } from "./planned/application/actual-mapper";
export type {
  Type5SurveyRecord,
  Type5ActualFormProps,
  ActualType5SurveyProps,
  Type5DetailViewProps,
  DetailType5SurveyProps,
  Type5ApprovalCardProps,
  ApprovalType5SurveyProps,
} from "./planned/types/actual.types";

// ⚪ ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 5 (Shared)
export {
  SURVEY_IMAGE_CATEGORIES,
  type SurveyImageCategory,
} from "./shared/constants";
export type {
  CustomerOption,
  StoreOption,
  ProductOption,
  Type5ImageFile,
  ImageFile,
} from "./shared/types";

// 🟠 โซน "นอกแผน" (Unplanned Sub-slice)
export { Type5UnplannedForm } from "./unplanned/components/type5-unplanned-form";
export {
  useType5UnplannedForm,
  type UseType5UnplannedFormOptions,
} from "./unplanned/hooks/use-type5-unplanned-form";
export {
  validateType5UnplannedItems,
  type Type5UnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType5UnplannedData,
  mapType5UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export { type5UnplannedStrategy } from "./unplanned/infrastructure/type5-unplanned.strategy";
export type {
  Type5UnplannedItem,
  Type5UnplannedFormProps,
} from "./unplanned/types/unplanned.types";
