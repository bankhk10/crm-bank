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
/**
 * Action: Get available demo plots (with real DemoPlot master records + legacy plan items fallback)
 */
export async function getDemoPlotsAction() {
  try {
    // 1. Fetch Farmer Customers to retrieve farm plots created in customer-form-farmer
    const farmerCustomers = await db.customer.findMany({
      where: {
        deletedAt: null,
        customerType: "FARMER",
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        farmPlots: true,
        addresses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const farmerMap = new Map<string, (typeof farmerCustomers)[0]>();
    farmerCustomers.forEach((f) => {
      farmerMap.set(f.id, f);
      if (f.name) farmerMap.set(f.name.trim(), f);
    });

    // 2. Fetch from Master DemoPlot table
    const masterPlots = await db.demoPlot.findMany({
      where: { deletedAt: null },
      include: {
        visits: {
          orderBy: { visitDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const realPlots: UserDemoPlotOption[] = masterPlots.map((p) => {
      const visitsCount = p.visits.length;
      const totalCost = p.visits.reduce(
        (sum, v) => sum + (Number(v.totalVisitCost) || 0),
        0,
      );
      const lastVisit = p.visits[p.visits.length - 1];
      const msPerDay = 1000 * 60 * 60 * 24;
      const latestDate = lastVisit ? new Date(lastVisit.visitDate) : new Date();
      const daysSinceStart = Math.max(
        0,
        Math.floor(
          (latestDate.getTime() - new Date(p.startDate).getTime()) / msPerDay,
        ),
      );

      // Check coordinates from linked farmer customer or location field
      const linkedCustomer =
        (p.customerId && farmerMap.get(p.customerId)) ||
        (p.ownerName && farmerMap.get(p.ownerName.trim()));

      let plotLat: string | undefined = undefined;
      let plotLng: string | undefined = undefined;

      if (linkedCustomer) {
        if (linkedCustomer.farmPlots && Array.isArray(linkedCustomer.farmPlots)) {
          const matchedPlot = (linkedCustomer.farmPlots as any[]).find(
            (fp) =>
              (fp.cropType && fp.cropType === p.cropName) ||
              (fp.latitude && fp.longitude),
          );
          if (matchedPlot) {
            plotLat = matchedPlot.latitude ? String(matchedPlot.latitude).trim() : undefined;
            plotLng = matchedPlot.longitude ? String(matchedPlot.longitude).trim() : undefined;
          }
        }
        if (!plotLat && linkedCustomer.latitude) {
          plotLat = String(linkedCustomer.latitude).trim();
        }
        if (!plotLng && linkedCustomer.longitude) {
          plotLng = String(linkedCustomer.longitude).trim();
        }
      }

      // Check if location string is formatted like "13.xxx, 100.xxx"
      if (!plotLat && !plotLng && p.location) {
        const coordMatch = p.location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          plotLat = coordMatch[1];
          plotLng = coordMatch[2];
        }
      }

      const formattedLocation =
        plotLat && plotLng
          ? `${plotLat}, ${plotLng}`
          : p.location || (p.ownerName ? `แปลงสาธิต ${p.ownerName}` : "");

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        location: formattedLocation,
        targetCrop: p.customCropName || p.cropName,
        showcase: p.primaryProductName,
        ownerName: p.ownerName,
        cropCategory: p.cropCategory,
        cropName: p.cropName,
        customCropName: p.customCropName || undefined,
        productName: p.primaryProductName,
        areaRai: p.areaRai ? Number(p.areaRai) : 0,
        treeCount: p.treeCount || 0,
        startDate: p.startDate ? p.startDate.toISOString().split("T")[0] : "",
        status: p.status,
        visitsCount,
        totalCost,
        daysSinceStart,
        objective: p.objective || undefined,
        experimentDetail: p.experimentDetail || undefined,
        latitude: plotLat,
        longitude: plotLng,
      };
    });

    // 3. Fetch from ActivityPlanItem (legacy fallback for backward compatibility)
    const items = await db.activityPlanItem.findMany({
      where: {
        activityPlan: { deletedAt: null },
        plotActivityType: "CREATE",
        plotOwnerName: { not: null },
      },
      include: {
        activityPlan: {
          select: { id: true, location: true, startDate: true },
        },
      },
      orderBy: { id: "desc" },
    });

    for (const item of items) {
      if (!item.plotOwnerName && !item.plotCropName) continue;

      const cropDisplay = item.plotCropName || "";
      const ownerDisplay = item.plotOwnerName || item.customerName || "เกษตรกร";
      const plotName = cropDisplay
        ? `${ownerDisplay} - ${cropDisplay}`
        : ownerDisplay;

      // Only add if not already present in masterPlots
      if (!realPlots.some((rp) => rp.name === plotName || rp.id === item.existingPlotId)) {
        realPlots.push({
          id: `legacy-${item.activityPlanId}-${item.id}`,
          name: plotName,
          location: item.activityPlan.location || `แปลงสาธิต ${ownerDisplay}`,
          targetCrop: cropDisplay,
          showcase: item.plotProductName || "",
          ownerName: ownerDisplay,
          cropCategory: item.plotCropCategory || "พืชสวน",
          cropName: cropDisplay || "พืชสวน",
          productName: item.plotProductName || "",
          areaRai: item.plotAreaRai ? Number(item.plotAreaRai) : 0,
          treeCount: item.plotTreeCount || 0,
          startDate: item.activityPlan.startDate ? item.activityPlan.startDate.toISOString().split("T")[0] : "",
          status: "IN_PROGRESS",
          visitsCount: 1,
          totalCost: 0,
          daysSinceStart: 0,
        });
      }
    }

    return serialize({
      success: true,
      demoPlots: realPlots,
    });
  } catch (err: any) {
    console.error("Failed to get demo plots", err);
    return serialize({
      success: false,
      demoPlots: [],
    });
  }
}

/**
 * Action: Get list of Farmer customers for Type 10 Field Day target selection
 */
export async function getFarmerCustomersAction() {
  try {
    const farmers = await db.customer.findMany({
      where: {
        deletedAt: null,
        customerType: "FARMER",
      },
      select: {
        id: true,
        name: true,
        farmPlots: true,
        province: true,
        district: true,
      },
      orderBy: { name: "asc" },
    });

    const options: string[] = [];

    farmers.forEach((f) => {
      const name = f.name?.trim();
      if (!name) return;

      const plots = Array.isArray(f.farmPlots) ? (f.farmPlots as any[]) : [];
      if (plots.length > 0) {
        const totalRai = plots.reduce(
          (sum, p) => sum + (Number(p.areaRai) || 0),
          0,
        );
        const crops = Array.from(
          new Set(plots.map((p) => p.cropType).filter(Boolean)),
        ).join(", ");

        const details: string[] = [];
        if (crops) details.push(crops);
        if (totalRai > 0) details.push(`${totalRai} ไร่`);
        else if (f.district || f.province) {
          details.push([f.district, f.province].filter(Boolean).join(" "));
        }

        const label =
          details.length > 0 ? `${name} (${details.join(" ")})` : name;
        options.push(label);
      } else {
        const loc = [f.district, f.province].filter(Boolean).join(" ");
        const label = loc ? `${name} (${loc})` : name;
        options.push(label);
      }
    });

    // Also include demo plot owner names if any
    const demoPlots = await db.demoPlot.findMany({
      where: { deletedAt: null },
      select: { ownerName: true, areaRai: true, cropName: true },
    });

    demoPlots.forEach((dp) => {
      const name = dp.ownerName?.trim();
      if (!name) return;
      const alreadyHas = options.some((opt) => opt.startsWith(name));
      if (!alreadyHas) {
        const details: string[] = [];
        if (dp.cropName) details.push(dp.cropName);
        if (dp.areaRai) details.push(`${Number(dp.areaRai)} ไร่`);
        const label =
          details.length > 0 ? `${name} (${details.join(" ")})` : name;
        options.push(label);
      }
    });

    return serialize({
      success: true,
      farmers: Array.from(new Set(options)),
    });
  } catch (err: any) {
    console.error("Failed to get farmer customers:", err);
    return serialize({
      success: false,
      farmers: [],
    });
  }
}

/**
 * Action: Get Demo Plot History with all visits
 */
export async function getDemoPlotHistoryAction(demoPlotIdOrName: string) {
  try {
    let plot: any = await db.demoPlot.findFirst({
      where: {
        OR: [
          { id: demoPlotIdOrName },
          { name: demoPlotIdOrName },
          { code: demoPlotIdOrName },
          { ownerName: demoPlotIdOrName },
        ],
        deletedAt: null,
      },
      include: {
        visits: {
          orderBy: { visitDate: "asc" },
          include: {
            activityPlan: {
              select: {
                id: true,
                code: true,
                title: true,
                startDate: true,
              },
            },
          },
        },
      },
    });

    let originalCreateItem: any = null;

    if (!plot && demoPlotIdOrName.startsWith("legacy-")) {
      const parts = demoPlotIdOrName.replace("legacy-", "").split("-");
      const planId = parts[0];
      const itemId = parts[1];
      if (planId) {
        originalCreateItem = await db.activityPlanItem.findFirst({
          where: { id: itemId, activityPlanId: planId },
          include: {
            activityPlan: {
              select: { id: true, code: true, title: true, startDate: true, location: true },
            },
          },
        });
        if (originalCreateItem) {
          const owner = originalCreateItem.plotOwnerName || originalCreateItem.customerName || "เกษตรกร";
          const crop = originalCreateItem.plotCropName || "พืชทั่วไป";
          plot = await db.demoPlot.findFirst({
            where: { ownerName: owner, cropName: crop, deletedAt: null },
            include: {
              visits: {
                orderBy: { visitDate: "asc" },
                include: {
                  activityPlan: {
                    select: {
                      id: true,
                      code: true,
                      title: true,
                      startDate: true,
                    },
                  },
                },
              },
            },
          });
        }
      }
    }

    // Also look up CREATE ActivityPlanItem if not yet found
    if (!originalCreateItem) {
      const ownerToSearch = plot?.ownerName || (demoPlotIdOrName.includes(" - ") ? demoPlotIdOrName.split(" - ")[0].trim() : demoPlotIdOrName);
      const cropToSearch = plot?.cropName || (demoPlotIdOrName.includes(" - ") ? demoPlotIdOrName.split(" - ")[1].trim() : undefined);

      originalCreateItem = await db.activityPlanItem.findFirst({
        where: {
          plotActivityType: "CREATE",
          activityPlan: { deletedAt: null },
          plotOwnerName: ownerToSearch,
          ...(cropToSearch ? { plotCropName: cropToSearch } : {}),
        },
        include: {
          activityPlan: {
            select: { id: true, code: true, title: true, startDate: true, location: true },
          },
        },
        orderBy: { id: "desc" },
      });
    }

    // Parse objective and experimentDetail from create item's detail
    let parsedObjective = "";
    let parsedExperiment = "";
    if (originalCreateItem?.detail) {
      const raw = originalCreateItem.detail;
      const objMatch = raw.match(/(?:วัตถุประสงค์ของแปลง|วัตถุประสงค์):\s*([^|]+)/);
      const expMatch = raw.match(/(?:รายละเอียด \/ วิธีการทดลอง|วิธีการทดลอง|รายละเอียดการทดลอง):\s*([^|]+)/);
      parsedObjective = objMatch ? objMatch[1].trim() : "";
      parsedExperiment = expMatch ? expMatch[1].trim() : (objMatch ? "" : raw);
    }

    if (!plot && originalCreateItem) {
      const owner = originalCreateItem.plotOwnerName || originalCreateItem.customerName || "เกษตรกร";
      const crop = originalCreateItem.plotCropName || "พืชทั่วไป";
      const plotName = `${owner} - ${crop}`;
      plot = {
        id: originalCreateItem.id,
        code: `DP-INIT`,
        name: plotName,
        ownerName: owner,
        cropName: crop,
        cropCategory: originalCreateItem.plotCropCategory || "พืชทั่วไป",
        primaryProductName: originalCreateItem.plotProductName || "",
        productName: originalCreateItem.plotProductName || "",
        areaRai: originalCreateItem.plotAreaRai ? Number(originalCreateItem.plotAreaRai) : null,
        treeCount: originalCreateItem.plotTreeCount || null,
        plotCount: originalCreateItem.plotCount != null ? Number(originalCreateItem.plotCount) : null,
        demoProductQuantity: originalCreateItem.plotCount != null ? Number(originalCreateItem.plotCount) : null,
        startDate: originalCreateItem.activityPlan?.startDate || new Date(),
        plantingDate: originalCreateItem.activityPlan?.startDate || null,
        objective: parsedObjective || null,
        experimentDetail: parsedExperiment || null,
        status: "IN_PROGRESS",
        visits: [],
      };
    }

    if (!plot) {
      return serialize({
        success: false,
        error: "ไม่พบแปลงสาธิต",
        plot: null,
      });
    }

    // Fill in objective and experimentDetail if empty in demoPlot record
    const finalObjective = plot.objective || parsedObjective || undefined;
    const finalExperiment = plot.experimentDetail || parsedExperiment || undefined;
    const finalPlotCount = (plot as any).plotCount ?? (originalCreateItem?.plotCount != null ? Number(originalCreateItem.plotCount) : undefined);

    const visits = plot.visits || [];
    const totalCost = visits.reduce(
      (sum: number, v: any) => sum + (Number(v.totalVisitCost) || 0),
      0,
    );
    const msPerDay = 1000 * 60 * 60 * 24;
    const now = new Date();
    const baseStartDate = plot.plantingDate || plot.startDate || now;
    const daysSinceStart = Math.max(
      0,
      Math.floor((now.getTime() - new Date(baseStartDate).getTime()) / msPerDay),
    );

    return serialize({
      success: true,
      plot: {
        ...plot,
        objective: finalObjective,
        experimentDetail: finalExperiment,
        plotCount: finalPlotCount,
        demoProductQuantity: finalPlotCount,
        totalCost,
        daysSinceStart,
        visitsCount: visits.length,
      },
    });
  } catch (err: any) {
    console.error("Failed to get demo plot history", err);
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการโหลดประวัติแปลง",
      plot: null,
    });
  }
}

/**
 * Action: Record Demo Plot Visit & Lifecycle status
 */
export async function recordDemoPlotVisitAction(rawData: any) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { recordDemoPlotVisit } = await import(
      "../infrastructure/activity-plan.repository"
    );

    const visit = await recordDemoPlotVisit({
      demoPlotId: rawData.demoPlotId,
      activityPlanId: rawData.activityPlanId ?? null,
      visitDate: rawData.visitDate ? new Date(rawData.visitDate) : new Date(),
      cropAgeValue: rawData.cropAgeValue ? Number(rawData.cropAgeValue) : null,
      cropAgeUnit: rawData.cropAgeUnit ?? "วัน",
      growthStage: rawData.growthStage ?? null,
      cropCondition: rawData.cropCondition ?? null,
      cropProblemDesc: rawData.cropProblemDesc ?? null,
      productResponse: rawData.productResponse ?? null,
      productProblemDesc: rawData.productProblemDesc ?? null,
      usageMethod: rawData.usageMethod ?? null,
      plantingDate: rawData.plantingDate ? new Date(rawData.plantingDate) : null,
      plantingAreaCondition: rawData.plantingAreaCondition ?? null,
      productUsedQty: rawData.productUsedQty ? Number(rawData.productUsedQty) : 0,
      productUnitPrice: rawData.productUnitPrice ? Number(rawData.productUnitPrice) : 0,
      otherExpenses: rawData.otherExpenses ? Number(rawData.otherExpenses) : 0,
      cropImageUrls: rawData.cropImageUrls || [],
      plotImageUrls: rawData.plotImageUrls || [],
      imageUrls: rawData.imageUrls || rawData.plotImageUrls || [],
      notes: rawData.notes ?? null,
      plotStatus: rawData.plotStatus,
      finalYieldKg: rawData.finalYieldKg ? Number(rawData.finalYieldKg) : null,
      controlYieldKg: rawData.controlYieldKg ? Number(rawData.controlYieldKg) : null,
      yieldIncreasePercent: rawData.yieldIncreasePercent ? Number(rawData.yieldIncreasePercent) : null,
      farmerSatisfaction: rawData.farmerSatisfaction ? Number(rawData.farmerSatisfaction) : null,
      commercialPotential: rawData.commercialPotential ?? null,
      finalSummaryNotes: rawData.finalSummaryNotes ?? null,
    });

    revalidatePath("/activity-plans");
    return serialize({ success: true, visit });
  } catch (err: any) {
    console.error("Failed to record demo plot visit", err);
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการบันทึกผลการเข้าตรวจแปลง",
    });
  }
}

// ─────────────────────────────────────────────────────────────
// PROMOTIONAL MATERIALS (สื่อส่งเสริมการขาย) SERVER ACTIONS
// ─────────────────────────────────────────────────────────────

import {
  listPromotionalMaterialsUseCase,
  getActivePromotionalMaterialsGroupedUseCase,
  getDistinctCategoriesUseCase,
  getPromotionalMaterialDetailUseCase,
  createPromotionalMaterialUseCase,
  updatePromotionalMaterialUseCase,
  deletePromotionalMaterialUseCase,
} from "../application/promotional-materials";

/**
 * List promotional materials with filters and pagination
 */
export async function getPromotionalMaterialsAction(params: any = {}) {
  const session = await auth();
  if (!session?.user) {
    return serialize({
      success: false,
      error: "Unauthorized",
      promotionalMaterials: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
  }

  try {
    const result = await listPromotionalMaterialsUseCase(params);
    return serialize({ success: true, ...result });
  } catch (err: any) {
    console.error("Failed to list promotional materials:", err);
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสื่อส่งเสริมการขาย",
      promotionalMaterials: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
  }
}

/**
 * Get active promotional materials grouped by category (for Budget Section dropdowns)
 */
export async function getActivePromotionalMaterialsGroupedAction() {
  try {
    const grouped = await getActivePromotionalMaterialsGroupedUseCase();
    return serialize({ success: true, grouped });
  } catch (err: any) {
    console.error("Failed to get grouped promotional materials:", err);
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการดึงรายการสื่อส่งเสริมการขาย",
      grouped: {},
    });
  }
}

/**
 * Get distinct categories of promotional materials
 */
export async function getDistinctPromotionalCategoriesAction() {
  try {
    const categories = await getDistinctCategoriesUseCase();
    return serialize({ success: true, categories });
  } catch (err: any) {
    console.error("Failed to get distinct categories:", err);
    return serialize({ success: false, categories: [] });
  }
}

/**
 * Get promotional material detail by ID
 */
export async function getPromotionalMaterialDetailAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  try {
    const material = await getPromotionalMaterialDetailUseCase(id);
    return serialize({ success: true, material });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่พบข้อมูลสื่อส่งเสริมการขาย",
    });
  }
}

/**
 * Create a new promotional material
 */
export async function createPromotionalMaterialAction(rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  const perms = session.user.permissionKeys ?? [];
  const canCreate =
    perms.includes("promotional_material.create") ||
    perms.includes("menu.promotional_materials") ||
    perms.includes("activity.manage") ||
    perms.includes("system.settings");

  if (!canCreate) {
    return serialize({ success: false, error: "Forbidden: ไม่มีสิทธิ์สร้างสื่อส่งเสริมการขาย" });
  }

  try {
    const result = await createPromotionalMaterialUseCase(rawData, session.user.id);
    revalidatePath("/activity-plans/promotional-materials");
    revalidatePath("/activity-plans/new");
    revalidatePath("/activity-plans");
    return serialize({ success: true, data: result.data });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถบันทึกข้อมูลสื่อส่งเสริมการขายได้",
    });
  }
}

/**
 * Update an existing promotional material
 */
export async function updatePromotionalMaterialAction(id: string, rawData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  const perms = session.user.permissionKeys ?? [];
  const canEdit =
    perms.includes("promotional_material.edit") ||
    perms.includes("menu.promotional_materials") ||
    perms.includes("activity.manage") ||
    perms.includes("system.settings");

  if (!canEdit) {
    return serialize({ success: false, error: "Forbidden: ไม่มีสิทธิ์แก้ไขสื่อส่งเสริมการขาย" });
  }

  try {
    const result = await updatePromotionalMaterialUseCase(id, rawData, session.user.id);
    revalidatePath("/activity-plans/promotional-materials");
    revalidatePath("/activity-plans/new");
    revalidatePath("/activity-plans");
    return serialize({ success: true, data: result.data });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถแก้ไขข้อมูลสื่อส่งเสริมการขายได้",
    });
  }
}

/**
 * Delete (Soft Delete) a promotional material
 */
export async function deletePromotionalMaterialAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  const perms = session.user.permissionKeys ?? [];
  const canDelete =
    perms.includes("promotional_material.delete") ||
    perms.includes("menu.promotional_materials") ||
    perms.includes("activity.manage") ||
    perms.includes("system.settings");

  if (!canDelete) {
    return serialize({ success: false, error: "Forbidden: ไม่มีสิทธิ์ลบสื่อส่งเสริมการขาย" });
  }

  try {
    const result = await deletePromotionalMaterialUseCase(id);
    revalidatePath("/activity-plans/promotional-materials");
    revalidatePath("/activity-plans/new");
    revalidatePath("/activity-plans");
    return serialize({ success: true, message: result.message, usageCount: result.usageCount });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถลบข้อมูลสื่อส่งเสริมการขายได้",
    });
  }
}


