// UI Components & Props
export {
  Type1Visit,
  Type1Visit as EditType1Visit,
} from "./components/type1-visit-form";
export type {
  Type1VisitProps,
  Type1VisitProps as EditType1VisitProps,
} from "./types";
export {
  Type1PlanCard,
  type Type1PlanCardProps,
} from "./components/type1-plan-card";
export { DetailType1Visit } from "./detail/detail-type1-visit";
export { ApprovalType1Visit } from "./approval/approval-type1-visit";
export { ActualType1Visit } from "./actual/actual-type1-visit";
export type { ActualType1VisitProps } from "./actual/types";

// Hooks
export { useType1Actual } from "./actual/use-type1-actual";
export {
  useType1Form,
  type UseType1FormOptions,
  type UseType1FormResult,
} from "./hooks/use-type1-form";

// Application Layer: Validation & Mappers (Client-safe)
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
  mapType1FormToPlanStore,
  mapType1DbStoreToFormItem,
  mapType1ActualFormToDb,
  extractType1PlanTargets,
  parseType1ActualResult,
  mapType1StoresToSectionItems,
} from "./application/mapper";

// Types
export type {
  Type1TargetItem,
  Type1ImageFile,
  Type1VisitItem,
  CustomerOption,
  CustomerOption as EditCustomerOption,
  ProductOption,
  Type1PlanStoreRecord,
  Type1ActualData,
  ValidateType1Options,
  Type1ValidationResult,
} from "./types";
