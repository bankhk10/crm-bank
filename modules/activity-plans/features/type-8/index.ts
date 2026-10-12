// Domain Types
export type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8MeetingItem,
  CustomerOption,
  ProductOption,
  ProductSaleDetail,
  Type8PromotionalProductLine,
  Type8TargetItem,
  Type8PlanItem,
  Type8ActualRecord,
  ActualType8MeetingProps,
  DetailType8MeetingProps,
  ApprovalType8MeetingProps,
} from "./types";

// Application Layer (Pure Mappers - Safe for Client)
export {
  extractType8PlanTargets,
  parseType8ActualResult,
  mapType8ToSectionItems,
} from "./application/mapper";

// UI Components & Cards
export {
  Type8PlanCard,
  type Type8PlanCardProps,
  type Type8PlanTarget,
} from "./shared/type8-plan-card";
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
export { useType8Actual } from "./actual/use-type8-actual";
export {
  useType8Form,
  type UseType8FormOptions,
  type UseType8FormResult,
} from "./hooks/use-type8-form";
export {
  encodeType8StoreNotes,
  decodeType8StoreNotes,
} from "./shared/type8-notes";
