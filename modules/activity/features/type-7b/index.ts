/**
 * Type 7B Feature: ติดตามแปลงสาธิต (Demo Plot Follow-up)
 * Vertical Slice Public API Contract (Dual-Mode: Planned + Unplanned)
 */

// 🟢 1. โซน "ในแผน" (Planned Sub-slice)
export {
  Type7bPlannedForm,
  Type7bPlanForm, // Backward-compatible alias
  Type7FollowUp, // Backward-compatible alias
} from "./planned/components/type7b-planned-form";
export { Type7bPlanCard } from "./planned/components/type7b-plan-card";
export {
  useType7bPlannedForm,
  useType7bForm, // Backward-compatible alias
  type UseType7bPlannedFormOptions,
  type UseType7bPlannedFormResult,
} from "./planned/hooks/use-type7b-planned-form";
export { validateType7bFormItems } from "./planned/application/planned-validation";
export {
  extractType7bPlanTargets,
  hydrateType7bPlannedData,
  mapType7bToSectionItems,
} from "./planned/application/planned-mapper";
export type {
  Type7bPlanItem,
  Type7bTargetItem,
  Type7bPlanCardTarget,
  Type7bPlanCardProps,
  Type7bPlannedFormProps,
  Type7bPlanFormProps,
  Type7FollowUpProps,
  ValidateType7bOptions,
  Type7bValidationResult,
} from "./planned/types/planned.types";

// 🔵 2. โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type7bActualForm,
  ActualType7FollowUp, // Backward-compatible alias
} from "./planned/components/type7b-actual-form";
export { useType7bActual } from "./planned/hooks/use-type7b-actual";
export {
  Type7bDetailView,
  DetailType7FollowUp, // Backward-compatible alias
  DetailType7bDemo, // Backward-compatible alias
} from "./planned/components/type7b-detail-view";
export {
  Type7bApprovalCard,
  ApprovalType7bDemo, // Backward-compatible alias
} from "./planned/components/type7b-approval-card";
export { validateType7bActual } from "./planned/application/actual-validation";
export { parseType7bActualResult } from "./planned/application/actual-mapper";
export type {
  Type7bActualRecord,
  Type7bActualFormProps,
  ActualType7FollowUpProps,
  Type7bDetailViewProps,
  Type7bApprovalCardProps,
  Type7bProductRateItem,
  Type7bSprayingRoundItem,
  Type7bBaselineProductItem,
  Type7bAdditionalProductItem,
  Type7bSprayRoundState,
  DemoPlotVisitHistoryItem,
} from "./planned/types/actual.types";

// ⚪ 3. ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 7B (Shared)
export * from "./shared/constants";
export * from "./shared/types";

// 🟠 4. โซน "นอกแผน" (Unplanned Sub-slice)
export { Type7bUnplannedForm } from "./unplanned/components/type7b-unplanned-form";
export {
  useType7bUnplannedForm,
  type UseType7bUnplannedFormOptions,
} from "./unplanned/hooks/use-type7b-unplanned-form";
export {
  validateType7bUnplannedItems,
  type Type7bUnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType7bUnplannedData,
  mapType7bUnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export * from "./unplanned/types/unplanned.types";
