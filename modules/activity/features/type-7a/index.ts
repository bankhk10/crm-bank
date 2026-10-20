/**
 * Type 7A Feature: จัดทำแปลงสาธิต (Demo Plot Establishment)
 * Vertical Slice Public API Contract (Dual-Mode: Planned + Unplanned)
 */

// 🟢 1. โซน "ในแผน" (Planned Sub-slice)
export {
  Type7aPlannedForm,
  Type7aPlanForm, // Backward-compatible alias
  Type7NewDemo, // Backward-compatible alias
  EditType7aNewDemo, // Backward-compatible alias
} from "./planned/components/type7a-planned-form";
export { Type7aPlanCard } from "./planned/components/type7a-plan-card";
export {
  useType7aPlannedForm,
  useType7aForm, // Backward-compatible alias
  type UseType7aPlannedFormOptions,
} from "./planned/hooks/use-type7a-planned-form";
export { validateType7aFormItems } from "./planned/application/planned-validation";
export {
  extractType7aPlanTargets,
  hydrateType7aPlannedData,
  mapType7aToSectionItems,
} from "./planned/application/planned-mapper";
export type {
  Type7aPlanItem,
  Type7aTargetItem,
  Type7aPlanCardTarget,
  Type7aPlanCardProps,
  Type7aPlannedFormProps,
  Type7aPlanFormProps,
  Type7NewDemoProps,
  ValidateType7aOptions,
  Type7aValidationResult,
} from "./planned/types/planned.types";

// 🔵 2. โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type7aActualForm,
  ActualType7NewDemo, // Backward-compatible alias
} from "./planned/components/type7a-actual-form";
export { useType7aActual } from "./planned/hooks/use-type7a-actual";
export {
  Type7aDetailView,
  DetailType7NewDemo, // Backward-compatible alias
} from "./planned/components/type7a-detail-view";
export {
  Type7aApprovalCard,
  ApprovalType7aDemo, // Backward-compatible alias
} from "./planned/components/type7a-approval-card";
export { validateType7aActual } from "./planned/application/actual-validation";
export { parseType7aActualResult } from "./planned/application/actual-mapper";
export type {
  Type7aActualRecord,
  Type7aActualFormProps,
  ActualType7NewDemoProps,
  Type7aDetailViewProps,
  DetailType7NewDemoProps,
  Type7aApprovalCardProps,
  ApprovalType7aDemoProps,
} from "./planned/types/actual.types";

// ⚪ 3. ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 7A (Shared)
export * from "./shared/constants";
export * from "./shared/types";

// 🟠 4. โซน "นอกแผน" (Unplanned Sub-slice)
export { Type7aUnplannedForm } from "./unplanned/components/type7a-unplanned-form";
export {
  useType7aUnplannedForm,
  type UseType7aUnplannedFormOptions,
} from "./unplanned/hooks/use-type7a-unplanned-form";
export {
  validateType7aUnplannedItems,
  type Type7aUnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType7aUnplannedData,
  mapType7aUnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export * from "./unplanned/types/unplanned.types";
