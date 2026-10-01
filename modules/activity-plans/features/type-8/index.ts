export type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8MeetingItem,
  CustomerOption,
  ProductOption,
} from "./shared/types";

export { Type8Meeting } from "./create/type8-meeting";
export type { Type8MeetingProps } from "./create/types";
export {
  validateType8FormItems,
  type ValidateType8Options,
  type Type8ValidationResult,
} from "./create/validation";

export {
  EditType8Meeting,
  type EditProductOption,
} from "./edit/edit-type8";

export { DetailType8Meeting } from "./detail/detail-type8-meeting";
export { ApprovalType8Meeting } from "./approval/approval-type8-meeting";
export { ActualType8Meeting } from "./actual/actual-type8-meeting";
export type {
  ProductSaleDetail,
  ActualType8MeetingProps,
  DetailType8MeetingProps,
  ApprovalType8MeetingProps,
} from "./actual/types";
export { useType8Actual } from "./actual/use-type8-actual";

export {
  useType8Form,
  type UseType8FormOptions,
  type UseType8FormResult,
} from "./hooks/use-type8-form";
