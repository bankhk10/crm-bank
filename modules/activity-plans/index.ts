// Export views (Client UI)
export { default as ActivityPlanListView } from "./features/shared/list-view/activity-plan-list-view";
export { default as ActivityPlanCreateView } from "./features/shared/form/activity-plan-create-view";
export { default as ActivityPlanEditView } from "./features/shared/form/activity-plan-edit-view";
export { default as ActivityPlanDetailView } from "./features/shared/detail-view/activity-plan-detail-view";
export { default as ActivityPlanApprovalListView } from "./features/shared/approve-view/activity-plan-approval-list-view";
export { default as ActivityPlanApprovalDetailView } from "./features/shared/approve-view/activity-plan-approval-detail-view";
export { default as ActivityPlanActualView } from "./features/shared/actual-view/activity-plan-actual-view";
export { default as PromotionalMaterialsView } from "./features/shared/promotional-materials/promotional-materials-view";
export { ActivityCalendarView } from "./features/shared/calendar-view/activity-calendar-view";
export {
  UnplannedCreateView,
  UnplannedEditView,
  UnplannedReviewQueueView,
  UnplannedReviewDetailView,
} from "./features/unplanned";

// Export UI components
export {
  ActivityStatusBadge,
  ActivityStatusWithOperator,
  resolveCurrentOperator,
  formatApproverRole,
  canUserPerformApproval,
} from "./ui/activity-status-badge";
export { FormActionButtons } from "./ui/form-action-buttons";

// Export types & constants
export type {
  ActivityPlanWithRelations,
  ActivityPlanType,
  ActivityStatus,
  ActivityApprovalStep,
  ActivityHelperStatus,
  ActivityApprovalAction,
} from "./types";
export * from "./constants";


