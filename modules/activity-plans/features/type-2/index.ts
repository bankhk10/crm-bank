// UI Components
export {
  Type2PlanForm,
  Type2Followup,
  Type2Followup as EditType2Followup,
} from "./components/type2-plan-form";
export type {
  Type2PlanFormProps,
  Type2FollowupProps,
  Type2FollowupProps as EditType2FollowupProps,
} from "./types";

export {
  Type2ActualForm,
  ActualType2Followup,
} from "./components/type2-actual-form";
export type {
  Type2ActualFormProps,
  ActualType2FollowupProps,
} from "./types";

export {
  Type2DetailView,
  DetailType2Followup,
} from "./components/type2-detail-view";
export type {
  Type2DetailViewProps,
  DetailType2FollowupProps,
} from "./types";

export {
  Type2ApprovalCard,
  ApprovalType2Followup,
} from "./components/type2-approval-card";
export type {
  Type2ApprovalCardProps,
  ApprovalType2FollowupProps,
} from "./types";

export {
  Type2PlanCard,
  type Type2PlanCardProps,
  type Type2PlanCardTarget,
  type Type2PlanCardTargetItem,
} from "./components/type2-plan-card";

// Hooks
export { useType2Actual } from "./hooks/use-type2-actual";
export {
  useType2Form,
  type UseType2FormOptions,
  type UseType2FormResult,
} from "./hooks/use-type2-form";

// Strategy (Vertical Slice Server/Application Strategy)
export { type2Strategy } from "./application/type2.strategy";

// Application Layer: Validation & Mappers
export {
  validateType2FormItems,
  type2FollowupProductLineSchema,
  type2ProductFollowupItemSchema,
  createType2ValidationSchema,
  type ValidateType2Options,
  type Type2ValidationResult,
} from "./application/validation";
export {
  extractType2PlanTargets,
  parseType2ActualResult,
  mapType2ToSectionItems,
} from "./application/mapper";

// Types
export type {
  Type2ProductFollowupItem,
  Type2FollowupProductLine,
  CustomerOption,
  CustomerOption as EditCustomerOption,
  ProductOption,
  ProductOption as EditProductOption,
  FollowupProductItem,
  Type2TargetItem,
  Type2ImageFile,
  ImageFile,
} from "./types";
