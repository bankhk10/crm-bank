// UI Components
export {
  Type1PlanForm,
  Type1Visit,
  Type1Visit as EditType1Visit,
} from "./components/type1-plan-form";
export type {
  Type1PlanFormProps,
  Type1VisitProps,
  Type1VisitProps as EditType1VisitProps,
} from "./types";

export {
  Type1ActualForm,
  ActualType1Visit,
} from "./components/type1-actual-form";
export type {
  Type1ActualFormProps,
  ActualType1VisitProps,
} from "./types";

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

// Hooks
export { useType1Actual } from "./hooks/use-type1-actual";
export {
  useType1Form,
  type UseType1FormOptions,
  type UseType1FormResult,
} from "./hooks/use-type1-form";

// Note: type1Strategy is deliberately NOT exported here to prevent Prisma Client leakage into client components.

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
  ImageFile,
  Type1VisitItem,
  CustomerOption,
  CustomerOption as EditCustomerOption,
  ProductOption,
  Type1PlanStoreRecord,
  Type1ActualData,
  ValidateType1Options,
  Type1ValidationResult,
} from "./types";
