// UI Components
export {
  Type3PlanForm,
  Type3Sales,
  Type3Sales as EditType3Sales,
} from "./components/type3-plan-form";
export type {
  Type3PlanFormProps,
  Type3SalesProps,
  Type3SalesProps as EditType3SalesProps,
} from "./types";

export {
  Type3ActualForm,
  ActualType3Sales,
} from "./components/type3-actual-form";
export type {
  Type3ActualFormProps,
  ActualType3SalesProps,
} from "./types";

export {
  Type3DetailView,
  DetailType3Sales,
} from "./components/type3-detail-view";
export type {
  Type3DetailViewProps,
  DetailType3SalesProps,
} from "./types";

export {
  Type3ApprovalCard,
  ApprovalType3Sales,
} from "./components/type3-approval-card";
export type {
  Type3ApprovalCardProps,
  ApprovalType3SalesProps,
} from "./types";

export {
  Type3PlanCard,
  type Type3PlanCardProps,
  type Type3PlanCardTarget,
  type Type3PlanCardTargetItem,
} from "./components/type3-plan-card";

// Hooks
export { useType3Actual } from "./hooks/use-type3-actual";
export {
  useType3Form,
  type UseType3FormOptions,
  type UseType3FormResult,
} from "./hooks/use-type3-form";

// Note: type3Strategy is deliberately NOT exported here to prevent Prisma Client leakage into client components.

// Application Layer: Validation & Mappers
export {
  validateType3FormItems,
  type ValidateType3Options,
  type Type3ValidationResult,
} from "./application/validation";
export {
  extractType3PlanTargets,
  parseType3ActualResult,
  mapType3ToSectionItems,
} from "./application/mapper";

// Types
export type {
  Type3SalesItem,
  Type3SalesProductLine,
  CustomerOption,
  CustomerOption as EditCustomerOption,
  ProductOption,
  ProductOption as EditProductOption,
  TargetProductItem,
  Type3ProductSaleDetail,
  Type3TargetItem,
} from "./types";
