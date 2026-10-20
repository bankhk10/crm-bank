/**
 * Type 11 Feature: ตรวจเช็คสต๊อกหน้าร้าน (Store Stock Check)
 * Vertical Slice Public API Contract (Dual-Mode: Planned + Unplanned)
 */

// 🟢 1. โซน "ในแผน" (Planned Sub-slice)
export {
  Type11PlannedForm,
  Type11PlanForm, // Backward-compatible alias
  Type11Stock, // Backward-compatible alias
  EditType11Stock, // Backward-compatible alias
} from "./planned/components/type11-planned-form";
export { Type11PlanCard } from "./planned/components/type11-plan-card";
export {
  useType11PlannedForm,
  useType11Form, // Backward-compatible alias
  type UseType11PlannedFormOptions,
  type UseType11PlannedFormResult,
} from "./planned/hooks/use-type11-planned-form";
export { validateType11FormItems } from "./planned/application/planned-validation";
export {
  extractType11PlanTargets,
  hydrateType11PlannedData,
  mapType11ToSectionItems,
} from "./planned/application/planned-mapper";
export {
  type11PlannedStrategy,
  type11Strategy, // Backward-compatible alias
} from "./planned/infrastructure/type11-planned.strategy";
export {
  findType11StoresByPlanId,
  saveType11ActualStockItems,
} from "./planned/infrastructure/type11.repository";
export type {
  Type11PlanItem,
  Type11TargetItem,
  Type11PlanTarget,
  Type11TargetStoreItem,
  Type11PlanCardProps,
  Type11PlannedFormProps,
  Type11PlanFormProps,
  Type11StockProps,
  ValidateType11Options,
  Type11ValidationResult,
} from "./planned/types/planned.types";

// 🔵 2. โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type11ActualForm,
  ActualType11Stock, // Backward-compatible alias
} from "./planned/components/type11-actual-form";
export { useType11Actual, validateType11Actual } from "./planned/hooks/use-type11-actual";
export {
  Type11DetailView,
  DetailType11Stock, // Backward-compatible alias
} from "./planned/components/type11-detail-view";
export {
  Type11ApprovalCard,
  ApprovalType11Stock, // Backward-compatible alias
} from "./planned/components/type11-approval-card";
export { parseType11ActualResult } from "./planned/application/actual-mapper";
export type {
  Type11ActualRecord,
  Type11ActualFormProps,
  ActualType11StockProps,
  Type11DetailViewProps,
  DetailType11StockProps,
  Type11ApprovalCardProps,
  ApprovalType11StockProps,
  Type11ActualValidationInput,
} from "./planned/types/actual.types";

// ⚪ 3. ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 11 (Shared)
export * from "./shared/constants";
export * from "./shared/types";
export * from "./shared/notes";

// 🟠 4. โซน "นอกแผน" (Unplanned Sub-slice)
export { Type11UnplannedForm } from "./unplanned/components/type11-unplanned-form";
export {
  useType11UnplannedForm,
  type UseType11UnplannedFormOptions,
  type UseType11UnplannedFormResult,
} from "./unplanned/hooks/use-type11-unplanned-form";
export { validateType11UnplannedItems } from "./unplanned/application/unplanned-validation";
export {
  hydrateType11UnplannedData,
  mapType11UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export { type11UnplannedStrategy } from "./unplanned/infrastructure/type11-unplanned.strategy";
export * from "./unplanned/types/unplanned.types";
