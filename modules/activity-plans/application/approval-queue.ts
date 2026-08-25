import { findApprovalQueueData } from "../infrastructure/activity-plan.repository";

export interface ApprovalQueueUserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  employeeId?: string | null;
  permissions: string[];
  roles: string[];
}

/**
 * Use Case: Get Approval Queue Data with In-Memory Categorization and Aggregations
 */
export async function getApprovalQueueDataUseCase(user: ApprovalQueueUserContext) {
  const { pendingPlans, historyPlans, activityTypes } = await findApprovalQueueData();

  const permissions = user.permissions ?? [];
  const roles = user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    permissions.includes("activity.manage");

  const userEmployeeId = user.employeeId;

  // Categorize
  const lineApprovalsForMe = pendingPlans.filter(
    (p) =>
      p.status === "PENDING_LINE_APPROVAL" &&
      (isAdmin || p.currentApproverEmployeeId === userEmployeeId),
  );

  const lineApprovalsAll = pendingPlans.filter(
    (p) => p.status === "PENDING_LINE_APPROVAL",
  );

  const budgetApprovals = pendingPlans.filter(
    (p) => p.status === "PENDING_BUDGET_APPROVAL",
  );

  const helperApprovals = pendingPlans.filter(
    (p) => p.status === "PENDING_HELPER_APPROVAL",
  );

  // Helper approvals where current user is the helper or helper's line manager
  const helperApprovalsForMe = pendingPlans.filter(
    (p) =>
      p.status === "PENDING_HELPER_APPROVAL" &&
      (isAdmin ||
        p.helpers.some(
          (h) =>
            h.employeeId === userEmployeeId ||
            h.approvedById === userEmployeeId,
        )),
  );

  // Calculate requested budgets
  let totalBudgetRequested = 0;
  for (const plan of pendingPlans) {
    const sp = plan.salesPromotionBudgetRequested
      ? Number(plan.salesPromotionBudgetRequested)
      : 0;
    const mkt = plan.marketingBudgetRequested
      ? Number(plan.marketingBudgetRequested)
      : 0;
    totalBudgetRequested += sp + mkt;
  }

  const counts = {
    totalPending: pendingPlans.length,
    myLinePending: lineApprovalsForMe.length,
    allLinePending: lineApprovalsAll.length,
    budgetPending: budgetApprovals.length,
    helperPending: helperApprovals.length,
    myHelperPending: helperApprovalsForMe.length,
    historyCount: historyPlans.length,
    totalBudgetRequested,
  };

  return {
    success: true as const,
    pendingPlans,
    historyPlans,
    activityTypes,
    counts,
    currentUser: {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      permissions,
    },
  };
}
