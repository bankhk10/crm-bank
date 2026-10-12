// Domain & Component Types
export type {
  Type9ProductItem,
  CustomerOption,
  ProductOption,
  EditCustomerOption,
  EditProductOption,
  Type9TargetProductItem,
  Type9ProductSaleDetail,
  Type9TargetItem,
  Type9PlanItem,
  Type9ActualRecord,
  Type9PlanTarget,
  Type9PlanCardProps,
  Type9StoreProps,
  Type9PlanFormProps,
  ActualType9StoreProps,
  Type9ActualFormProps,
  DetailType9StoreProps,
  Type9DetailViewProps,
  ApprovalType9StoreProps,
  Type9ApprovalCardProps,
  ValidateType9Options,
  Type9ValidationResult,
  UseType9FormOptions,
  UseType9FormResult,
} from "./types";

// Application Layer (Pure Mappers - Safe for Client)
export {
  extractType9PlanTargets,
  parseType9ActualResult,
  mapType9ToSectionItems,
} from "./application/mapper";

// Application Layer (Pure Validation - Safe for Client)
export {
  validateType9FormItems,
} from "./application/validation";

// UI Components (Vertical Slice Standard)
export { Type9PlanCard } from "./components/type9-plan-card";
export {
  Type9PlanForm,
  Type9Store,
} from "./components/type9-plan-form";
export { Type9PlanForm as EditType9Store } from "./components/type9-plan-form";
export {
  Type9ActualForm,
  ActualType9Store,
} from "./components/type9-actual-form";
export {
  Type9DetailView,
  DetailType9Store,
} from "./components/type9-detail-view";
export {
  Type9ApprovalCard,
  ApprovalType9Store,
} from "./components/type9-approval-card";

// React Hooks
export {
  useType9Form,
} from "./hooks/use-type9-form";
export { useType9Actual } from "./hooks/use-type9-actual";
