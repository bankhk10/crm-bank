"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import {
  USER_DEMO_PLOTS,
  type UserDemoPlotOption,
} from "../features/form/constants";
import {
  createActivityPlanUseCase,
  updateActivityPlanUseCase,
  deleteActivityPlanUseCase,
  getActivityPlanDetailUseCase,
  listActivityPlansUseCase,
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  cancelActivityPlanUseCase,
  findOrCreateEmployeeForUser,
  findApprovalQueueData,
  type ListActivityPlansParams,
} from "../application";

/**
 * Helper to serialize objects containing Prisma Decimals / Dates to plain JSON objects
 */
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Action: Create an Activity Plan
 */
export async function createActivityPlanAction(rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Permission check
  const permissions = session.user.permissionKeys ?? [];
  if (
    !permissions.includes("activity.create") &&
    !permissions.includes("activity.manage")
  ) {
    return {
      success: false,
      error: "Forbidden: คุณไม่มีสิทธิ์สร้าง Trip Plan",
    };
  }

  try {
    const result = await createActivityPlanUseCase(session.user.id, rawData, {
      name: session.user.name ?? undefined,
      email: session.user.email ?? undefined,
    });
    if (result.success) {
      revalidatePath("/activity-plans");
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Update an Activity Plan
 */
export async function updateActivityPlanAction(id: string, rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  if (
    !permissions.includes("activity.edit") &&
    !permissions.includes("activity.manage")
  ) {
    return {
      success: false,
      error: "Forbidden: คุณไม่มีสิทธิ์แก้ไข Trip Plan",
    };
  }

  try {
    const result = await updateActivityPlanUseCase(
      id,
      session.user.id,
      rawData,
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Delete an Activity Plan
 */
export async function deleteActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  if (
    !permissions.includes("activity.delete") &&
    !permissions.includes("activity.manage")
  ) {
    return { success: false, error: "Forbidden: คุณไม่มีสิทธิ์ลบ Trip Plan" };
  }

  try {
    const result = await deleteActivityPlanUseCase(id, session.user.id);
    if (result.success) {
      revalidatePath("/activity-plans");
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Submit an Activity Plan (Request Approval)
 */
export async function submitActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await submitActivityPlanUseCase(id, session.user.id);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Approve an Activity Plan
 */
export async function approveActivityPlanAction(id: string, comment?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo");

  if (
    !isAdmin &&
    !permissions.includes("activity.approve") &&
    !permissions.includes("activity.manage")
  ) {
    return {
      success: false,
      error: "Forbidden: คุณไม่มีสิทธิ์อนุมัติ Trip Plan",
    };
  }

  try {
    const result = await approveActivityPlanUseCase(
      id,
      session.user.id,
      comment,
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Reject an Activity Plan
 */
export async function rejectActivityPlanAction(id: string, comment?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo");

  if (
    !isAdmin &&
    !permissions.includes("activity.approve") &&
    !permissions.includes("activity.manage")
  ) {
    return {
      success: false,
      error: "Forbidden: คุณไม่มีสิทธิ์ปฏิเสธ Trip Plan",
    };
  }

  try {
    const result = await rejectActivityPlanUseCase(
      id,
      session.user.id,
      comment,
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Request Correction on an Activity Plan
 */
export async function requestCorrectionPlanAction(id: string, comment: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo");

  if (
    !isAdmin &&
    !permissions.includes("activity.approve") &&
    !permissions.includes("activity.manage")
  ) {
    return {
      success: false,
      error: "Forbidden: คุณไม่มีสิทธิ์ส่งตีกลับ Trip Plan",
    };
  }

  try {
    const result = await requestCorrectionPlanUseCase(
      id,
      session.user.id,
      comment,
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Cancel an Activity Plan
 */
export async function cancelActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await cancelActivityPlanUseCase(id, session.user.id);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Get single plan detail
 */
export async function getActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Unauthorized" };

  try {
    const result = await getActivityPlanDetailUseCase(id);
    return serialize(result);
  } catch {
    return {
      success: false as const,
      error: "ล้มเหลวในการดึงข้อมูล Trip Plan",
    };
  }
}

/**
 * Action: List plans
 */
export async function getActivityPlansAction(
  params: ListActivityPlansParams = {},
) {
  const session = await auth();
  if (!session?.user) return { success: false, activityPlans: [], total: 0 };

  try {
    const result = await listActivityPlansUseCase(params);
    return serialize({
      success: true,
      activityPlans: result.activityPlans,
      total: result.total,
    });
  } catch {
    return { success: false, activityPlans: [], total: 0 };
  }
}

/**
 * Action: Get current logged-in user employee profile
 */
export async function getCurrentUserEmployeeAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    const employee = await findOrCreateEmployeeForUser(
      session.user.id,
      session.user.name ?? undefined,
      session.user.email ?? undefined,
    );

    return serialize({
      success: true as const,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      employee: {
        id: employee.id,
        name: employee.name,
        positionTitle: employee.positionTitle || employee.position?.name,
        departmentName: employee.departmentName || employee.department?.name,
      },
    });
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน",
    };
  }
}

/**
 * Action: Get Activity Types Lookup
 */
export async function getActivityTypesAction() {
  try {
    const types = await db.activityType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return serialize({ success: true, types });
  } catch (err: any) {
    return serialize({ success: false, types: [], error: err.message });
  }
}

/**
 * Action: Get approval queue data and statistics
 */
export async function getApprovalQueueDataAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    permissions.includes("activity.manage");

  const canApprove =
    isAdmin ||
    permissions.includes("activity.approve") ||
    permissions.includes("activity.manage") ||
    permissions.includes("menu.activity_plans");

  if (!canApprove) {
    return {
      success: false as const,
      error: "Forbidden: คุณไม่มีสิทธิ์เข้าถึงคิวงานอนุมัติ",
    };
  }

  try {
    const { pendingPlans, historyPlans, activityTypes } =
      await findApprovalQueueData();

    const userEmployeeId = session.user.employeeId;

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

    return serialize({
      success: true as const,
      pendingPlans,
      historyPlans,
      activityTypes,
      counts,
      currentUser: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        employeeId: session.user.employeeId,
        permissions,
      },
    });
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message || "เกิดข้อผิดพลาดในการโหลดคิวงานอนุมัติ",
    };
  }
}

/**
 * Action: Record Post-Activity Outcome (ActivityResult)
 */
export async function recordActivityResultAction(planId: string, rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { recordActivityResultUseCase } = await import("../application");
    const result = await recordActivityResultUseCase(planId, session.user.id, rawData);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath(`/activity-plans/${planId}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Get existing demo plots from created activity plans (from ActivityPlanItem wide table)
 */
export async function getDemoPlotsAction() {
  try {
    const items = await db.activityPlanItem.findMany({
      where: {
        activityPlan: { deletedAt: null },
        OR: [
          { plotActivityType: "CREATE" },
          { plotOwnerName: { not: null } },
        ],
      },
      include: {
        activityPlan: {
          select: { id: true, location: true, startDate: true },
        },
      },
      orderBy: { id: "desc" },
    });

    const realPlots: UserDemoPlotOption[] = [];

    for (const item of items) {
      if (item.plotActivityType === "FOLLOW_UP") continue;
      if (!item.plotOwnerName && !item.plotCropName) continue;

      const cropDisplay = item.plotCropName || "";
      const ownerDisplay = item.plotOwnerName || item.customerName || "เกษตรกร";
      const plotName = cropDisplay
        ? `${ownerDisplay} - ${cropDisplay}`
        : ownerDisplay;

      realPlots.push({
        id: `plot-${item.activityPlanId}-${item.id}`,
        name: plotName,
        location: item.activityPlan.location || `แปลงสาธิต ${ownerDisplay}`,
        targetCrop: cropDisplay,
        showcase: item.plotProductName || "สินค้าสาธิต",
        ownerName: ownerDisplay,
        cropCategory: item.plotCropCategory || "พืชสวน",
        cropName: cropDisplay || "พืชสวน",
        productName: item.plotProductName || "",
        areaRai: item.plotAreaRai ? Number(item.plotAreaRai) : 0,
        treeCount: item.plotTreeCount || 0,
        startDate: item.activityPlan.startDate ? item.activityPlan.startDate.toISOString().split("T")[0] : "",
      });
    }

    const combinedMap = new Map<string, UserDemoPlotOption>();
    realPlots.forEach((p) => combinedMap.set(p.name, p));

    return serialize({
      success: true,
      demoPlots: Array.from(combinedMap.values()),
    });
  } catch (err: any) {
    console.error("Failed to get demo plots", err);
    return serialize({
      success: false,
      demoPlots: [],
    });
  }
}

