// Domain & Component Types
export type {
  Type7bWithdrawnProductLine,
  ProductOption,
  UserDemoPlotOption,
  FollowUpPlanOption,
  Type7DemoProductLine,
  Type7DemoPlotItem,
  Type7bPlotInput,
  Type7bProductInput,
  Type7bDataInput,
  Type7bTargetItem,
  Type7bActualRecord,
  Type7bPlanItem,
  Type7bPlanTarget,
  Type7bPlanCardProps,
  Type7FollowUpProps,
  Type7bPlanFormProps,
  EditProductOption,
  ActualType7FollowUpProps,
  Type7bActualFormProps,
  DemoPlotVisitHistoryItem,
  DetailType7FollowUpProps,
  Type7bDetailViewProps,
  ApprovalType7bDemoProps,
  Type7bApprovalCardProps,
  DemoPlotHistoryModalProps,
  ValidateType7bOptions,
  Type7bValidationResult,
  Type7bActualValidationInput,
  UseType7bFormOptions,
  UseType7bFormResult,
} from "./types";

// Application Layer (Pure Mappers - Safe for Client)
export {
  extractType7bPlanTargets,
  parseType7bActualResult,
  mapType7bToSectionItems,
} from "./application/mapper";

// Application Layer (Pure Validation - Safe for Client)
export {
  validateType7bFormItems,
  validateType7bActual,
} from "./application/validation";

// UI Components (Vertical Slice Standard)
export { Type7bPlanCard } from "./components/type7b-plan-card";
export {
  Type7bPlanForm,
  Type7FollowUp,
} from "./components/type7b-plan-form";
export { Type7bPlanForm as EditType7bFollowUp } from "./components/type7b-plan-form";
export {
  Type7bActualForm,
  ActualType7FollowUp,
} from "./components/type7b-actual-form";
export {
  Type7bDetailView,
  DetailType7FollowUp,
} from "./components/type7b-detail-view";
export {
  Type7bApprovalCard,
  ApprovalType7bDemo,
} from "./components/type7b-approval-card";
export { DemoPlotHistoryModal } from "./components/demo-plot-history-modal";

// React Hooks
export {
  useType7bForm,
} from "./hooks/use-type7b-form";
export { useType7bActual } from "./hooks/use-type7b-actual";
