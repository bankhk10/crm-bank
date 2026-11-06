/**
 * Type 9 Feature: จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Store Event / Sales Promotion)
 * Vertical Slice Public API Contract (Dual-Mode: Planned + Unplanned)
 */

// 🟢 1. โซน "ในแผน" (Planned Sub-slice)
export {
  Type9PlannedForm,
  Type9PlanForm, // Backward-compatible alias
  Type9Store, // Backward-compatible alias
} from "./planned/components/type9-planned-form";
export { Type9PlanCard } from "./planned/components/type9-plan-card";
export {
  useType9PlannedForm,
  useType9Form, // Backward-compatible alias
  type UseType9PlannedFormOptions,
  type UseType9PlannedFormResult,
} from "./planned/hooks/use-type9-planned-form";
export { validateType9FormItems } from "./planned/application/planned-validation";
export {
  extractType9PlanTargets,
  hydrateType9PlannedData,
  mapType9ToSectionItems,
} from "./planned/application/planned-mapper";
export type {
  Type9PlanItem,
  Type9TargetItem,
  Type9PlanTarget,
  Type9PlanCardProps,
  Type9PlannedFormProps,
  Type9PlanFormProps,
  Type9StoreProps,
  ValidateType9Options,
  Type9ValidationResult,
} from "./planned/types/planned.types";

// 🔵 2. โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type9ActualForm,
  ActualType9Store, // Backward-compatible alias
} from "./planned/components/type9-actual-form";
export { useType9Actual, validateType9Actual } from "./planned/hooks/use-type9-actual";
export {
  Type9DetailView,
  DetailType9Store, // Backward-compatible alias
} from "./planned/components/type9-detail-view";
export {
  Type9ApprovalCard,
  ApprovalType9Store, // Backward-compatible alias
} from "./planned/components/type9-approval-card";
export { parseType9ActualResult } from "./planned/application/actual-mapper";
export type {
  Type9ActualRecord,
  Type9ActualFormProps,
  ActualType9StoreProps,
  Type9DetailViewProps,
  DetailType9StoreProps,
  Type9ApprovalCardProps,
  ApprovalType9StoreProps,
  Type9ActualValidationInput,
} from "./planned/types/actual.types";

// ⚪ 3. ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 9 (Shared)
export * from "./shared/constants";
export * from "./shared/types";
export * from "./shared/notes";

// 🟠 4. โซน "นอกแผน" (Unplanned Sub-slice)
export { Type9UnplannedForm } from "./unplanned/components/type9-unplanned-form";
export {
  useType9UnplannedForm,
  type UseType9UnplannedFormOptions,
  type UseType9UnplannedFormResult,
} from "./unplanned/hooks/use-type9-unplanned-form";
export { validateType9UnplannedItems } from "./unplanned/application/unplanned-validation";
export {
  hydrateType9UnplannedData,
  mapType9UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export * from "./unplanned/types/unplanned.types";
