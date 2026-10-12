// Domain & Component Types
export type {
  Type10SoldProductItem,
  ProductOption,
  SoldProductItem,
  Type10SoldProductDetail,
  Type10TargetItem,
  Type10PlanItem,
  Type10ActualRecord,
  Type10PlanTarget,
  Type10PlanCardProps,
  Type10FieldDayProps,
  Type10PlanFormProps,
  ActualType10FieldDayProps,
  Type10ActualFormProps,
  DetailType10FieldDayProps,
  Type10DetailViewProps,
  ApprovalType10FieldDayProps,
  Type10ApprovalCardProps,
  ValidateType10Options,
  Type10ValidationResult,
  UseType10FormOptions,
  UseType10FormResult,
} from "./types";

// Application Layer (Pure Mappers - Safe for Client)
export {
  extractType10PlanTargets,
  parseType10ActualResult,
  mapType10ToSectionItems,
} from "./application/mapper";

// Application Layer (Pure Validation - Safe for Client)
export {
  validateType10FormItems,
} from "./application/validation";

// UI Components (Vertical Slice Standard)
export { Type10PlanCard } from "./components/type10-plan-card";
export {
  Type10PlanForm,
  Type10FieldDay,
} from "./components/type10-plan-form";
export { Type10PlanForm as EditType10FieldDay } from "./components/type10-plan-form";
export {
  Type10ActualForm,
  ActualType10FieldDay,
} from "./components/type10-actual-form";
export {
  Type10DetailView,
  DetailType10FieldDay,
} from "./components/type10-detail-view";
export {
  Type10ApprovalCard,
  ApprovalType10FieldDay,
} from "./components/type10-approval-card";

// React Hooks & Schemas
export {
  useType10Form,
  type10SoldProductItemSchema,
} from "./hooks/use-type10-form";
export { useType10Actual } from "./hooks/use-type10-actual";
