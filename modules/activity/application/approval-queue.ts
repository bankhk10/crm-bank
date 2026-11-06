import {
  findApprovalQueueData,
  type ApprovalQueueFilterOptions,
} from "../infrastructure/activity-approval.repository";
import { db } from "@/lib/db";
import {
  canUserPerformApproval,
  isUserAdmin,
  isUserSalesDirector,
  isUserSalesAdminManager,
  isUserMarketingManager,
  type ApproverUserContext,
} from "../domain/approval";

export interface ApprovalQueueUserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  employeeId?: string | null;
  permissions: string[];
  roles: string[];
}

/**
 * Recursively find all direct and indirect subordinate employee IDs under a given manager
 */
export async function getSubordinateEmployeeIds(employeeId: string): Promise<string[]> {
  const result: string[] = [];
  let currentManagerIds = [employeeId];

  while (currentManagerIds.length > 0) {
    const subordinates = await db.employee.findMany({
      where: {
        deletedAt: null,
        managerId: { in: currentManagerIds },
      },
      select: { id: true },
    });

    if (subordinates.length === 0) break;

    const nextIds = subordinates.map((s) => s.id);
    result.push(...nextIds);
    currentManagerIds = nextIds;
  }

  return result;
}

/**
 * Use Case: Get Approval Queue Data with In-Memory Categorization and Aggregations
 * Conforms to Aggregated Approval Paradigm:
 * - 1 Activity Plan = 1 item per approver
 * - Uses canUserPerformApproval(plan, user) as Single Source of Truth
 */
export async function getApprovalQueueDataUseCase(user: ApprovalQueueUserContext) {
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

  // Determine whether this user has executive/global approver visibility:
  // - Admin / CEO
  // - Sales Director (e.g. คุณนวีณ)
  // - Sales Admin Manager (e.g. คุณธีระยุทธ)
  // - Marketing Manager (e.g. คุณคมสัน)
  // - Permissions: activity.manage or activity.view_all
  const isGlobalApprover =
    isUserAdmin(approverContext) ||
    isUserSalesDirector(approverContext) ||
    isUserSalesAdminManager(approverContext) ||
    isUserMarketingManager(approverContext) ||
    permissions.includes("activity.manage") ||
    permissions.includes("activity.view_all");

  // If not a global approver, fetch all subordinates in their branch/hierarchy
  const subordinateEmployeeIds =
    !isGlobalApprover && userEmployeeId
      ? await getSubordinateEmployeeIds(userEmployeeId)
      : [];

  const { pendingPlans, historyPlans, activityTypes } = await findApprovalQueueData({
    isGlobalApprover,
    userId: user.id,
    employeeId: userEmployeeId,
    subordinateEmployeeIds,
  });

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
