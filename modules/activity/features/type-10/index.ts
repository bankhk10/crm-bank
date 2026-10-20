/**
 * Type 10 Feature: จัดงาน Field Day (Field Day Event)
 * Vertical Slice Public API Contract (Dual-Mode: Planned + Unplanned)
 */

// 🟢 1. โซน "ในแผน" (Planned Sub-slice)
export {
  Type10PlannedForm,
  Type10PlanForm, // Backward-compatible alias
  Type10FieldDay, // Backward-compatible alias
} from "./planned/components/type10-planned-form";
export { Type10PlanCard } from "./planned/components/type10-plan-card";
export {
  useType10PlannedForm,
  useType10Form, // Backward-compatible alias
  type UseType10PlannedFormOptions,
  type UseType10PlannedFormResult,
} from "./planned/hooks/use-type10-planned-form";
export { validateType10Form } from "./planned/application/planned-validation";
export {
  extractType10PlanTargets,
  hydrateType10PlannedData,
  mapType10ToSectionItems,
} from "./planned/application/planned-mapper";
export {
  type10PlannedStrategy,
  type10Strategy, // Backward-compatible alias
} from "./planned/infrastructure/type10-planned.strategy";
export {
  findType10ByPlanId,
  saveType10ActualSaleItems,
} from "./planned/infrastructure/type10.repository";
export type {
  Type10PlanItem,
  Type10TargetItem,
  Type10PlanTarget,
  Type10PlanCardProps,
  Type10PlannedFormProps,
  Type10PlanFormProps,
  Type10FieldDayProps,
  ValidateType10Options,
  Type10ValidationResult,
} from "./planned/types/planned.types";

// 🔵 2. โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type10ActualForm,
  ActualType10FieldDay, // Backward-compatible alias
} from "./planned/components/type10-actual-form";
export { useType10Actual, validateType10Actual } from "./planned/hooks/use-type10-actual";
export {
  Type10DetailView,
  DetailType10FieldDay, // Backward-compatible alias
} from "./planned/components/type10-detail-view";
export {
  Type10ApprovalCard,
  ApprovalType10FieldDay, // Backward-compatible alias
} from "./planned/components/type10-approval-card";
export { parseType10ActualResult } from "./planned/application/actual-mapper";
export type {
  Type10ActualRecord,
  Type10ActualFormProps,
  ActualType10FieldDayProps,
  Type10DetailViewProps,
  DetailType10FieldDayProps,
  Type10ApprovalCardProps,
  ApprovalType10FieldDayProps,
  Type10ActualValidationInput,
} from "./planned/types/actual.types";

// ⚪ 3. ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 10 (Shared)
export * from "./shared/constants";
export * from "./shared/types";
export * from "./shared/notes";

// 🟠 4. โซน "นอกแผน" (Unplanned Sub-slice)
export { Type10UnplannedForm } from "./unplanned/components/type10-unplanned-form";
export {
  useType10UnplannedForm,
  type UseType10UnplannedFormOptions,
  type UseType10UnplannedFormResult,
} from "./unplanned/hooks/use-type10-unplanned-form";
export { validateType10UnplannedItems } from "./unplanned/application/unplanned-validation";
export {
  hydrateType10UnplannedData,
  mapType10UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export { type10UnplannedStrategy } from "./unplanned/infrastructure/type10-unplanned.strategy";
export * from "./unplanned/types/unplanned.types";
