// =============================================================================
// TYPE 1: เข้าพบร้านค้า / Key Farmer - Public API Contract
// =============================================================================

// 🟢 โซน "ในแผน" (Planned Sub-slice)
export { Type1PlannedForm } from "./planned/components/type1-planned-form";
export { useType1PlannedForm } from "./planned/hooks/use-type1-planned-form";
export {
  validateType1PlannedItem,
  type1PlannedSchema,
} from "./planned/validation";
export type {
  Type1PlannedItem,
  Type1PlannedFormProps,
} from "./planned/types";

// 🟡 โซน "นอกแผน" (Unplanned Sub-slice)
export { Type1UnplannedForm } from "./unplanned/components/type1-unplanned-form";
export { useType1UnplannedForm } from "./unplanned/hooks/use-type1-unplanned-form";
export {
  validateType1UnplannedItem,
  type1UnplannedSchema,
} from "./unplanned/validation";
export type {
  Type1UnplannedItem,
  Type1UnplannedFormProps,
} from "./unplanned/types";

// 🔵 โซน "บันทึกผลงานในแผน" (Actual Result Sub-slice)
export {
  Type1ActualForm,
  ActualType1Visit,
} from "./actual/components/type1-actual-form";
export { useType1Actual } from "./actual/hooks/use-type1-actual";
export type {
  Type1ActualFormProps,
  ActualType1VisitProps,
} from "./actual/types";

// ⚪ ชิ้นส่วนที่ใช้ร่วมกัน (Shared)
export { VISIT_TOPICS } from "./shared/types";
export type {
  CustomerOption,
  CustomerOption as EditCustomerOption,
  ProductOption,
  Type1ImageFile,
  ImageFile,
  Type1AdviceProductItem,
} from "./shared/types";

// ⚪ คอมโพเนนต์แสดงผล Detail, Approval, Card
export {
  Type1DetailView,
  DetailType1Visit,
} from "./components/type1-detail-view";
export type {
  Type1DetailViewProps,
  DetailType1VisitProps,
} from "./types";

export {
  Type1ApprovalCard,
  ApprovalType1Visit,
} from "./components/type1-approval-card";
export type {
  Type1ApprovalCardProps,
  ApprovalType1VisitProps,
} from "./types";

export {
  Type1PlanCard,
  type Type1PlanCardProps,
} from "./components/type1-plan-card";

// Aliases for backward compatibility
export {
  Type1PlannedForm as Type1PlanForm,
  Type1PlannedForm as Type1Visit,
  Type1PlannedForm as EditType1Visit,
} from "./planned/components/type1-planned-form";
export type {
  Type1PlannedFormProps as Type1PlanFormProps,
  Type1PlannedFormProps as Type1VisitProps,
  Type1PlannedFormProps as EditType1VisitProps,
} from "./planned/types";

export {
  useType1Form,
  type UseType1FormOptions,
  type UseType1FormResult,
} from "./hooks/use-type1-form";

// Application Layer: Validation & Mappers
export {
  validateType1FormItem,
  type1PlanStoreSchema,
  type1PlanStoresSchema,
  type1ActualResultSchema,
  type Type1PlanStoreValues,
  type Type1PlanStoresValues,
  type Type1ActualResultValues,
} from "./application/validation";

export {
  hydrateType1PlannedData,
  hydrateType1UnplannedData,
  mapType1FormToPlanStore,
  mapType1DbStoreToFormItem,
  mapType1ActualFormToDb,
  extractType1PlanTargets,
  parseType1ActualResult,
  mapType1StoresToSectionItems,
} from "./application/mapper";

export type {
  Type1TargetItem,
  Type1TargetActualItem,
  Type1VisitItem,
  Type1PlanStoreRecord,
  Type1ActualData,
  ValidateType1Options,
  Type1ValidationResult,
} from "./types";
