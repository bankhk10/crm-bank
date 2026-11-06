/**
 * Type 8 Feature: จัดประชุม (Meeting)
 * Vertical Slice Public API Contract (Dual-Mode: Planned + Unplanned)
 */

// 🟢 1. โซน "ในแผน" (Planned Sub-slice)
export {
  Type8PlannedForm,
  Type8PlanForm, // Backward-compatible alias
  Type8Meeting, // Backward-compatible alias
} from "./planned/components/type8-planned-form";
export { Type8PlanCard } from "./planned/components/type8-plan-card";
export {
  useType8PlannedForm,
  useType8Form, // Backward-compatible alias
  type UseType8PlannedFormOptions,
  type UseType8PlannedFormResult,
} from "./planned/hooks/use-type8-planned-form";
export { validateType8FormItems } from "./planned/application/planned-validation";
export {
  extractType8PlanTargets,
  hydrateType8PlannedData,
  mapType8ToSectionItems,
} from "./planned/application/planned-mapper";
export type {
  Type8PlanItem,
  Type8TargetItem,
  Type8PlanTarget,
  Type8PlanCardProps,
  Type8PlannedFormProps,
  Type8PlanFormProps,
  Type8MeetingProps,
  ValidateType8Options,
  Type8ValidationResult,
} from "./planned/types/planned.types";

// 🔵 2. โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type8ActualForm,
  ActualType8Meeting, // Backward-compatible alias
} from "./planned/components/type8-actual-form";
export { useType8Actual } from "./planned/hooks/use-type8-actual";
export {
  Type8DetailView,
  DetailType8Meeting, // Backward-compatible alias
} from "./planned/components/type8-detail-view";
export {
  Type8ApprovalCard,
  ApprovalType8Meeting, // Backward-compatible alias
} from "./planned/components/type8-approval-card";
export { validateType8Actual } from "./planned/application/actual-validation";
export { parseType8ActualResult } from "./planned/application/actual-mapper";
export type {
  Type8ActualRecord,
  Type8ActualFormProps,
  ActualType8MeetingProps,
  Type8DetailViewProps,
  DetailType8MeetingProps,
  Type8ApprovalCardProps,
  ApprovalType8MeetingProps,
  Type8ActualValidationInput,
} from "./planned/types/actual.types";

// ⚪ 3. ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 8 (Shared)
export * from "./shared/constants";
export * from "./shared/types";
export * from "./shared/notes";

// 🟠 4. โซน "นอกแผน" (Unplanned Sub-slice)
export { Type8UnplannedForm } from "./unplanned/components/type8-unplanned-form";
export {
  useType8UnplannedForm,
  type UseType8UnplannedFormOptions,
} from "./unplanned/hooks/use-type8-unplanned-form";
export {
  validateType8UnplannedItems,
  type Type8UnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType8UnplannedData,
  mapType8UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export * from "./unplanned/types/unplanned.types";
