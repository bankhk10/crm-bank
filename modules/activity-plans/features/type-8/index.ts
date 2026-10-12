// Domain & Component Types
export type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
  Type8MeetingItem,
  CustomerOption,
  ProductOption,
  EditProductOption,
  ProductSaleDetail,
  Type8PromotionalProductLine,
  Type8TargetItem,
  Type8PlanItem,
  Type8ActualRecord,
  Type8PlanTarget,
  Type8PlanCardProps,
  Type8MeetingProps,
  Type8PlanFormProps,
  ActualType8MeetingProps,
  Type8ActualFormProps,
  DetailType8MeetingProps,
  Type8DetailViewProps,
  ApprovalType8MeetingProps,
  Type8ApprovalCardProps,
  ValidateType8Options,
  Type8ValidationResult,
  Type8ActualValidationInput,
  DecodedType8Notes,
  UseType8FormOptions,
  UseType8FormResult,
} from "./types";

// Application Layer (Pure Mappers - Safe for Client)
export {
  extractType8PlanTargets,
  parseType8ActualResult,
  mapType8ToSectionItems,
} from "./application/mapper";

// Application Layer (Pure Validation - Safe for Client)
export {
  validateType8FormItems,
  validateType8Actual,
} from "./application/validation";

// Application Layer (Notes utilities - Safe for Client)
export {
  encodeType8StoreNotes,
  decodeType8StoreNotes,
} from "./application/notes";

// UI Components (Vertical Slice Standard)
export { Type8PlanCard } from "./components/type8-plan-card";
export {
  Type8PlanForm,
  Type8Meeting,
} from "./components/type8-plan-form";
export { Type8PlanForm as EditType8Meeting } from "./components/type8-plan-form";
export {
  Type8ActualForm,
  ActualType8Meeting,
} from "./components/type8-actual-form";
export {
  Type8DetailView,
  DetailType8Meeting,
} from "./components/type8-detail-view";
export {
  Type8ApprovalCard,
  ApprovalType8Meeting,
} from "./components/type8-approval-card";

// React Hooks
export {
  useType8Form,
} from "./hooks/use-type8-form";
export { useType8Actual } from "./hooks/use-type8-actual";
