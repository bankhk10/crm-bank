// =============================================================================
// TYPE 1: เข้าพบร้านค้า / Key Farmer - Public API Contract
// =============================================================================

// 🟢 โซน "ในแผน" (Planned Sub-slice)
export { Type1PlannedForm } from "./planned/components/type1-planned-form";
export { useType1PlannedForm } from "./planned/hooks/use-type1-planned-form";
export {
  validateType1PlannedItem,
  type1PlannedSchema,
  type1ActualResultSchema,
  type ValidatePlannedOptions,
  type PlannedValidationResult,
  type Type1PlannedStoreValues,
  type Type1ActualResultValues,
} from "./planned/application/planned-validation";
export {
  mapType1PlannedItemToDb,
  mapType1DbStoreToPlannedItem,
  hydrateType1PlannedData,
  extractType1PlanTargets,
  mapType1StoresToSectionItems,
} from "./planned/application/planned-mapper";
export {
  mapType1ActualFormToDb,
  parseType1ActualResult,
  parseTargetText,
  aggregateType1TargetItems,
} from "./planned/application/actual-mapper";
export { type1PlannedStrategy } from "./planned/infrastructure/type1-planned.strategy";
export type {
  Type1PlannedItem,
  Type1PlannedFormProps,
  Type1TargetItem,
  Type1PlanCardProps,
  Type1DetailViewProps,
  Type1ApprovalCardProps,
} from "./planned/types/planned.types";

// 🔵 โซน "ผลงานจริงในแผน" (Actual Result Sub-slice)
export {
  Type1ActualForm,
  ActualType1Visit,
} from "./planned/components/type1-actual-form";
export { useType1Actual } from "./planned/hooks/use-type1-actual";
export { Type1DetailView, DetailType1Visit } from "./planned/components/type1-detail-view";
export { Type1ApprovalCard, ApprovalType1Visit } from "./planned/components/type1-approval-card";
export { Type1PlanCard } from "./planned/components/type1-plan-card";
export type {
  Type1TargetActualItem,
  Type1ActualFormProps,
  ActualType1VisitProps,
  Type1ActualData,
} from "./planned/types/actual.types";

// 🟡 โซน "นอกแผน" (Unplanned Sub-slice)
export { Type1UnplannedForm } from "./unplanned/components/type1-unplanned-form";
export { useType1UnplannedForm } from "./unplanned/hooks/use-type1-unplanned-form";
export {
  validateType1UnplannedItem,
  type1UnplannedSchema,
  type ValidateUnplannedOptions,
  type UnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType1UnplannedData,
  mapType1UnplannedItemToStore,
} from "./unplanned/application/unplanned-mapper";
export { type1UnplannedStrategy } from "./unplanned/infrastructure/type1-unplanned.strategy";
export type {
  Type1UnplannedItem,
  Type1UnplannedFormProps,
} from "./unplanned/types/unplanned.types";

// ⚪ ชิ้นส่วนที่ใช้ร่วมกันภายใน Type 1 (Shared)
export { VISIT_TOPICS, type VisitTopic } from "./shared/constants";
export type {
  CustomerOption,
  ProductOption,
  Type1ImageFile,
  ImageFile,
  Type1AdviceProductItem,
} from "./shared/types";
