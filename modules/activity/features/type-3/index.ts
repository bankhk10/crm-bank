// =============================================================================
// TYPE 3: เสนอขายสินค้า (Product Sales Proposal) - Public API Contract
// =============================================================================

// 🟢 โซน "ในแผน" (Planned Sub-slice)
export { Type3PlanForm } from "./planned/components/type3-plan-form";
export { Type3PlanCard } from "./planned/components/type3-plan-card";
export { useType3Form } from "./planned/hooks/use-type3-form";
export {
  validateType3FormItems,
  type3SalesItemSchema,
  type3ProductLineSchema,
  type ValidateType3Options,
  type Type3ValidationResult,
} from "./planned/application/planned-validation";
export {
  extractType3PlanTargets,
  hydrateType3PlannedData,
  mapType3FormToPayload,
  mapType3ToSectionItems,
} from "./planned/application/planned-mapper";
export { type3PlannedStrategy } from "./planned/infrastructure/type3-planned.strategy";
export type {
  Type3SalesItem,
  Type3SalesProductLine,
  TargetProductItem,
  Type3TargetItem,
  Type3PlanCardTargetItem,
  Type3PlanCardTarget,
  Type3PlanCardProps,
  Type3PlanFormProps,
} from "./planned/types/planned.types";

// 🔵 โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export { Type3ActualForm } from "./planned/components/type3-actual-form";
export { useType3Actual } from "./planned/hooks/use-type3-actual";
export { Type3DetailView } from "./planned/components/type3-detail-view";
export { Type3ApprovalCard } from "./planned/components/type3-approval-card";
export {
  validateType3Actual,
  type ValidateType3ActualOptions,
  type Type3ActualValidationResult,
} from "./planned/application/actual-validation";
export {
  parseType3ActualResult,
  mapType3ActualFormToDb,
} from "./planned/application/actual-mapper";
export type {
  Type3ProductSaleDetail,
  Type3SaleResultItem,
  Type3ActualFormProps,
  Type3ActualData,
  Type3DetailViewProps,
  Type3ApprovalCardProps,
} from "./planned/types/actual.types";

// 🟡 โซน "นอกแผน" (Unplanned Sub-slice)
export { Type3UnplannedForm } from "./unplanned/components/type3-unplanned-form";
export { useType3UnplannedForm } from "./unplanned/hooks/use-type3-unplanned-form";
export {
  validateType3UnplannedForm,
  validateType3UnplannedItem,
  type3UnplannedProductSchema,
  type3UnplannedItemSchema,
  type Type3UnplannedValidationResult,
  type ValidateType3UnplannedOptions,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType3UnplannedData,
  mapType3UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export { type3UnplannedStrategy } from "./unplanned/infrastructure/type3-unplanned.strategy";
export type {
  Type3UnplannedItem,
  Type3UnplannedProductItem,
  Type3UnplannedFormProps,
  Type3UnplannedPayload,
} from "./unplanned/types/unplanned.types";

// ⚪ ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 3 (Shared)
export {
  NOT_CLOSED_REASONS,
  SALE_STATUSES,
  SALE_STATUS_CONFIG,
  type SaleStatus,
} from "./shared/constants";
export type {
  StoreOption,
  ProductOption,
  Type3ImageFile,
} from "./shared/types";
