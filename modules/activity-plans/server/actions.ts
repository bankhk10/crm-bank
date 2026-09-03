"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  createActivityPlanUseCase,
  duplicateActivityPlanUseCase,
  updateActivityPlanUseCase,
  deleteActivityPlanUseCase,
  getActivityPlanDetailUseCase,
  listActivityPlansUseCase,
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  cancelActivityPlanUseCase,
  reviewSingleActivityHelperUseCase,
  listActivityCalendarEventsUseCase,
  findOrCreateEmployeeForUser,
  getApprovalQueueDataUseCase,
  getActivityTypesUseCase,
  getDemoPlotsUseCase,
  getFarmerCustomersUseCase,
  getDemoPlotHistoryUseCase,
  recordDemoPlotVisitUseCase,
  type ListActivityPlansParams,
  type ListCalendarEventsParams,
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
 * Action: Duplicate an Activity Plan
 */
export async function duplicateActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = (session.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session.user as any)?.role === "administrator" ||
    (session.user as any)?.role === "ADMIN";

  if (
    !isAdmin &&
    !permissions.includes("activity.create") &&
    !permissions.includes("activity.manage")
  ) {
    return {
      success: false,
      error: "Forbidden: คุณไม่มีสิทธิ์ทำสำเนา Trip Plan",
    };
  }

  try {
    const result = await duplicateActivityPlanUseCase(id, session.user.id, {
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
    const types = await getActivityTypesUseCase();
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
    const result = await getApprovalQueueDataUseCase({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      employeeId: session.user.employeeId,
      permissions,
      roles,
    });

    return serialize(result);
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
    const result = await getDemoPlotsUseCase();
    return serialize(result);
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
    const result = await getFarmerCustomersUseCase();
    return serialize(result);
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
    const result = await getDemoPlotHistoryUseCase(demoPlotIdOrName);
    return serialize(result);
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
    const result = await recordDemoPlotVisitUseCase(rawData);
    revalidatePath("/activity-plans");
    return serialize(result);
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

/**
 * Action: Review an individual Helper employee (Approve or Reject with reason)
 */
export async function reviewSingleActivityHelperAction(
  activityPlanId: string,
  helperEmployeeId: string,
  decision: "APPROVE" | "REJECT",
  rejectionReason?: string,
) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  try {
    const result = await reviewSingleActivityHelperUseCase(
      activityPlanId,
      helperEmployeeId,
      session.user.id,
      decision,
      rejectionReason,
    );

    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath(`/activity-plans/${activityPlanId}`);
      revalidatePath("/activity-plans/calendar");
    }

    return serialize(result);
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการพิจารณาผู้ช่วยงาน",
    });
  }
}

/**
 * Action: Get Activity Calendar Events
 */
export async function getActivityCalendarEventsAction(
  params: {
    startDate?: string;
    endDate?: string;
    viewAll?: boolean;
  } = {},
) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized", events: [] });
  }

  try {
    const employee = await findOrCreateEmployeeForUser(
      session.user.id,
      session.user.name ?? undefined,
      session.user.email ?? undefined,
    );

    const result = await listActivityCalendarEventsUseCase({
      employeeId: employee?.id,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      viewAll: params.viewAll ?? false,
    });

    return serialize(result);
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถโหลดข้อมูลปฏิทินได้",
      events: [],
    });
  }
}


