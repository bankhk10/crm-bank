// Domain Types
export type {
  TourType,
  TourSize,
  CustomerOption,
  Type12TourDataPayload,
  Type12TargetItem,
  Type12PlanItem,
  Type12PlanCardProps,
  DetailType12TourProps,
  ApprovalType12TourProps,
} from "./types";

// Pure Mappers
export {
  extractType12PlanTargets,
  mapType12ToSectionItems,
} from "./application/mapper";

// Shared Components
export {
  Type12PlanCard,
} from "./shared/type12-plan-card";

// Create
export { Type12Tour } from "./create/type12-tour";
export type { Type12TourProps } from "./create/types";
export { validateType12FormValues } from "./create/validation";

// Edit
export {
  EditType12Tour,
  type EditCustomerOption,
} from "./edit/edit-type12";

// Detail
export { DetailType12Tour } from "./detail/detail-type12-tour";

// Approval
export { ApprovalType12Tour } from "./approval/approval-type12-tour";

// Hook
export {
  useType12Form,
  type UseType12FormOptions,
  type UseType12FormResult,
} from "./hooks/use-type12-form";
