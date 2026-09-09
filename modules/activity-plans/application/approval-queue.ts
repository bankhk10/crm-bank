import { findApprovalQueueData } from "../infrastructure/activity-plan.repository";
import { db } from "@/lib/db";
import {
  canUserPerformApproval,
  type ApproverUserContext,
} from "./can-approve";

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
 * Conforms to Aggregated Approval Paradigm:
 * - 1 Activity Plan = 1 item per approver
 * - Uses canUserPerformApproval(plan, user) as Single Source of Truth
 */
export async function getApprovalQueueDataUseCase(user: ApprovalQueueUserContext) {
  const { pendingPlans, historyPlans, activityTypes } = await findApprovalQueueData();

  const permissions = user.permissions ?? [];
  const roles = user.roles ?? [];
  const userEmployeeId = user.employeeId;

  // Resolve user's department and position for fine-grained queue filtering
  let userDeptCode = "";
  let userPosTitle = "";
  if (userEmployeeId) {
    const emp = await db.employee.findUnique({
      where: { id: userEmployeeId },
      include: { department: true, position: true },
    });
    userDeptCode = (emp?.department?.code || "").toUpperCase();
    userPosTitle = (emp?.position?.name || emp?.positionTitle || "").toLowerCase();
  }

  const approverContext: ApproverUserContext = {
    id: user.id,
    name: user.name,
    email: user.email,
    employeeId: userEmployeeId,
    roles,
    permissions,
    departmentCode: userDeptCode,
    positionTitle: userPosTitle,
  };

  // 1. myPendingPlans: Single Source of Truth via canUserPerformApproval
  // Ensures 1 Activity Plan = 1 item, zero duplicates across Line / Budget / Helper
  const myPendingPlans = pendingPlans.filter((p) =>
    canUserPerformApproval(p, approverContext),
  );

  // Calculate requested budgets for summary
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
    myPending: myPendingPlans.length,
    myLinePending: myPendingPlans.length, // Alias for backward compatibility
    historyCount: historyPlans.length,
    totalBudgetRequested,
  };

  return {
    success: true as const,
    pendingPlans,
    myPendingPlans,
    historyPlans,
    activityTypes,
    counts,
    currentUser: {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      permissions,
      roles,
      departmentCode: userDeptCode,
      positionTitle: userPosTitle,
    },
  };
}
