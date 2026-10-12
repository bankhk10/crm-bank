// ==========================================
// Types
// ==========================================
export type {
  Type11StoreItem,
  CustomerOption,
  EditCustomerOption,
  ProductOption,
  Type11TargetStoreItem,
  Type11TargetItem,
  Type11PlanTarget,
  Type11StockItem,
  StockCheckItem,
  Type11PlanItem,
  Type11ActualRecord,
  Type11PlanCardProps,
  Type11StockProps,
  Type11PlanFormProps,
  ActualType11StockProps,
  Type11ActualFormProps,
  DetailType11StockProps,
  Type11DetailViewProps,
  ApprovalType11StockProps,
  Type11ApprovalCardProps,
  ValidateType11Options,
  Type11ValidationResult,
  Type11StockItemInput,
} from "./types";

// ==========================================
// Application & Mappers & Validation
// ==========================================
export {
  extractType11PlanTargets,
  parseType11ActualResult,
  mapType11ToSectionItems,
} from "./application/mapper";

export {
  validateType11FormItems,
  validateType11Actual,
} from "./application/validation";

// ==========================================
// Components (Vertical Slice)
// ==========================================
export {
  Type11PlanCard,
} from "./components/type11-plan-card";

export {
  Type11PlanForm,
  Type11Stock,
  EditType11Stock,
} from "./components/type11-plan-form";

export {
  Type11ActualForm,
  ActualType11Stock,
} from "./components/type11-actual-form";

export {
  Type11DetailView,
  DetailType11Stock,
} from "./components/type11-detail-view";

export {
  Type11ApprovalCard,
  ApprovalType11Stock,
} from "./components/type11-approval-card";

// ==========================================
// Hooks
// ==========================================
export {
  useType11Form,
  type UseType11FormOptions,
  type UseType11FormResult,
} from "./hooks/use-type11-form";

export {
  useType11Actual,
} from "./hooks/use-type11-actual";
