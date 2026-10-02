export type {
  Type2ProductFollowupItem,
  Type2FollowupProductLine,
  CustomerOption,
  ProductOption,
} from "./shared/types";
export { Type2Followup } from "./create/type2-followup";
export type { Type2FollowupProps } from "./create/types";
export {
  validateType2FormItems,
  type ValidateType2Options,
  type Type2ValidationResult,
} from "./create/validation";
export {
  EditType2Followup,
  type EditCustomerOption,
  type EditProductOption,
  type EditType2FollowupProps,
} from "./edit/edit-type2";
export { DetailType2Followup } from "./detail/detail-type2-followup";
export { ApprovalType2Followup } from "./approval/approval-type2-followup";
export { ActualType2Followup } from "./actual/actual-type2-followup";
export type { FollowupProductItem, ActualType2FollowupProps } from "./actual/types";
export { useType2Actual } from "./actual/use-type2-actual";
export {
  useType2Form,
  type UseType2FormOptions,
  type UseType2FormResult,
} from "./hooks/use-type2-form";
export {
  Type2PlanCard,
  type Type2PlanCardProps,
  type Type2PlanCardTarget,
  type Type2PlanCardTargetItem,
} from "./shared/type2-plan-card";
