import { findApprovalQueueData } from "../infrastructure/activity-plan.repository";
import { db } from "@/lib/db";

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

  const isDirector =
    userPosTitle.includes("ผู้จัดการฝ่ายขาย") ||
    userPosTitle.includes("ผจก.ฝ่ายขาย") ||
    userPosTitle.includes("sales director");

  const isSalesAdmin =
    !isDirector &&
    (userDeptCode === "SA" ||
      userPosTitle.includes("บริหารงานขาย") ||
      userPosTitle.includes("sales admin"));

  const isMkt =
    userDeptCode === "MKT" ||
    userPosTitle.includes("การตลาด") ||
    userPosTitle.includes("marketing");

  // Categorize
  const lineApprovalsForMe = pendingPlans.filter(
    (p) =>
      p.status === "PENDING_LINE_APPROVAL" &&
      (isAdmin || p.currentApproverEmployeeId === userEmployeeId),
  );

  const lineApprovalsAll = pendingPlans.filter(
    (p) => p.status === "PENDING_LINE_APPROVAL",
  );

  // Budget queue: only show plans where this user has an active pending budget turn
  const budgetApprovals = pendingPlans.filter((p) => {
    if (p.status !== "PENDING_BUDGET_APPROVAL") return false;
    if (isAdmin) return true;

    const hasSP =
      p.salesPromotionBudgetRequested &&
      Number(p.salesPromotionBudgetRequested) > 0;
    const hasMKT =
      p.marketingBudgetRequested && Number(p.marketingBudgetRequested) > 0;
    const spPending = hasSP && p.salesPromotionApproved !== true;
    const mktPending = hasMKT && p.marketingApproved !== true;
    const directorPending =
      (!hasSP || p.salesPromotionApproved === true) &&
      (!hasMKT || p.marketingApproved === true) &&
      p.salesManagerApproved !== true;

    const unreviewedHelpers = (p.helpers || []).filter(
      (h: any) => h.status === "PENDING" && !(h as any).respondedAt,
    );
    const hasUnreviewedSalesHelpers = unreviewedHelpers.some((h: any) => {
      const dept = (h.employee?.department?.code || "").toUpperCase();
      const pos = (h.employee?.positionTitle || "").toLowerCase();
      return (
        dept === "SA" ||
        dept === "SS" ||
        pos.includes("เซลส์") ||
        pos.includes("ส่งเสริม") ||
        pos.includes("ขาย")
      );
    });
    const hasUnreviewedMktHelpers = unreviewedHelpers.some((h: any) => {
      const dept = (h.employee?.department?.code || "").toUpperCase();
      const pos = (h.employee?.positionTitle || "").toLowerCase();
      return dept === "MKT" || pos.includes("การตลาด");
    });

    if (isDirector && directorPending) return true;
    if (isSalesAdmin && (spPending || hasUnreviewedSalesHelpers)) return true;
    if (isMkt && (mktPending || hasUnreviewedMktHelpers)) return true;
    return false;
  });

  const helperApprovals = pendingPlans.filter(
    (p) => p.status === "PENDING_HELPER_APPROVAL",
  );

  // Helper queue: only show plans where this user has pending unreviewed helpers
  const helperApprovalsForMe = pendingPlans.filter((p) => {
    if (p.status !== "PENDING_HELPER_APPROVAL") return false;
    if (isAdmin) return true;

    const unreviewedHelpers = (p.helpers || []).filter(
      (h: any) => h.status === "PENDING" && !(h as any).respondedAt,
    );
    if (unreviewedHelpers.length === 0) return false;

    if (
      isSalesAdmin &&
      unreviewedHelpers.some((h: any) => {
        const dept = (h.employee?.department?.code || "").toUpperCase();
        const pos = (h.employee?.positionTitle || "").toLowerCase();
        return (
          dept === "SA" ||
          dept === "SS" ||
          pos.includes("เซลส์") ||
          pos.includes("ส่งเสริม") ||
          pos.includes("ขาย")
        );
      })
    ) {
      return true;
    }

    if (
      isMkt &&
      unreviewedHelpers.some((h: any) => {
        const dept = (h.employee?.department?.code || "").toUpperCase();
        const pos = (h.employee?.positionTitle || "").toLowerCase();
        return dept === "MKT" || pos.includes("การตลาด");
      })
    ) {
      return true;
    }

    return false;
  });

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

  const myPendingPlanIds = new Set([
    ...lineApprovalsForMe.map((p) => p.id),
    ...budgetApprovals.map((p) => p.id),
    ...helperApprovalsForMe.map((p) => p.id),
  ]);
  const myPendingPlans = pendingPlans.filter((p) => myPendingPlanIds.has(p.id));

  const counts = {
    totalPending: pendingPlans.length,
    myLinePending: myPendingPlans.length,
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
    myPendingPlans,
    lineApprovalsForMe,
    budgetApprovals,
    helperApprovalsForMe,
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
