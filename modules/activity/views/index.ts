// =============================================================================
// Activity Module - Views Public Contract (Screen / Page Level)
// =============================================================================

// 📋 1. List View (/activity-plans)
export { default as ActivityPlanListView } from "./list/activity-plan-list-view";
export { ActivityPlanTable } from "./list/activity-plan-table";

// 📅 2. Calendar View (/activity-plans/calendar)
export { ActivityCalendarView } from "./calendar/activity-calendar-view";

// ✅ 3. Approval Views (/activity-plans/approvals)
export { default as ActivityPlanApprovalListView } from "./approvals/activity-plan-approval-list-view";
export { default as ActivityPlanApprovalDetailView } from "./approvals/activity-plan-approval-detail-view";

// 🔍 4. Detail View (/activity-plans/[id])
export { default as ActivityPlanDetailView } from "./detail/activity-plan-detail-view";

// ✍️ 5. Planned Views (/activity-plans/new, /activity-plans/[id]/edit)
export { PlannedCreateView } from "./planned/create-view";
export { PlannedEditView } from "./planned/edit-view";
export { PlannedActivityForm } from "./planned/components/planned-activity-form";

// ⚡ 6. Unplanned Views (/activity-plans/unplanned/new, /activity-plans/unplanned/[id]/edit)
export { UnplannedCreateView } from "./unplanned/create-view";
export { UnplannedEditView } from "./unplanned/edit-view";
export { UnplannedActivityForm } from "./unplanned/components/unplanned-activity-form";

// 📝 7. Actual View (/activity-plans/[id]/actual)
export { default as ActivityPlanActualView } from "./actual/activity-plan-actual-view";

// 📦 8. Promotional Materials View (/activity-plans/promotional-materials)
export { default as PromotionalMaterialsView } from "./promotional-materials/promotional-materials-view";
