// ==========================================
// Types
// ==========================================
export type {
  Type13PlotProduct,
  Type13WithdrawnProductLine,
  Type13PlotItem,
  Type13ExternalProduct,
  Type13SprayingProduct,
  Type13SprayingRoundAttachment,
  Type13SprayingRound,
  DealerOption,
  ProductOption,
  Type13PlanStorePayload,
  Type13ActualProductState,
  Type13PlotActualState,
  Type13TargetItem,
  Type13PlanTarget,
  Type13PlanCardProps,
  Type13CreateProps,
  Type13EditProps,
  Type13PlanFormProps,
  Type13ActualProps,
  Type13ActualFormProps,
  UseType13ActualStateResult,
  Type13DetailActualProduct,
  Type13DetailExternalProduct,
  Type13DetailSprayRound,
  Type13DetailData,
  Type13DetailProps,
  DetailType13AttackProps,
  Type13DetailViewProps,
  Type13ApprovalProps,
  Type13ApprovalCardProps,
  ValidateType13Params,
  ValidateType13Options,
  Type13ValidationResult,
} from "./types";

export { TYPE13_MAX_IMAGES_PER_VILLAGE } from "./types";

// ==========================================
// Application & Mappers & Validation
// ==========================================
export {
  extractType13PlanTargets,
  mapType13ToSectionItems,
} from "./application/mapper";

export {
  validateType13FormValues,
  validateType13Actual,
} from "./application/validation";

// ==========================================
// Components (Vertical Slice)
// ==========================================
export {
  Type13PlanCard,
} from "./components/type13-plan-card";

export {
  Type13PlanForm,
  Type13Create,
  Type13Edit,
} from "./components/type13-plan-form";

export {
  Type13ActualForm,
  Type13Actual,
} from "./components/type13-actual-form";

export {
  Type13DetailView,
  DetailType13Attack,
  Type13Detail,
} from "./components/type13-detail-view";

export {
  Type13ApprovalCard,
  Type13Approval,
} from "./components/type13-approval-card";

// ==========================================
// Hooks
// ==========================================
export {
  useType13Form,
  type UseType13FormOptions,
  type UseType13FormResult,
} from "./hooks/use-type13-form";

export {
  useType13ActualState,
  useType13Actual,
} from "./hooks/use-type13-actual";
