"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { Prisma, ActivityPlanType, ActivityStatus } from "@prisma/client";
import { type1PlannedStrategy } from "../features/type-1/planned/infrastructure/type1-planned.strategy";
import { type1UnplannedStrategy } from "../features/type-1/unplanned/infrastructure/type1-unplanned.strategy";
import { ACTIVITY_PLAN_FULL_INCLUDE } from "../infrastructure/activity-plan-include";
import {
  generateActivityPlanCode,
  computeFiscalFields,
  resolveActivityTypeId,
} from "../infrastructure/activity-plan.repository";
import { findOrCreateEmployeeForUser } from "../infrastructure/employee-lookup.repository";

// Helper serialize Prisma Decimals/Dates
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export type PlanActionResult = {
  success: boolean;
  plan?: any;
  error?: string;
};

/**
 * Action: Create an Activity Plan (Self-contained in modules/activity)
 * Preserves all dedicated work type fields (such as Type 1 topic and notes) without stripping.
 */
export async function createActivityPlanAction(rawData: any): Promise<PlanActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
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
      success: false as const,
      error: "Forbidden: คุณไม่มีสิทธิ์สร้าง Trip Plan",
    };
  }

  try {
    const employee = await findOrCreateEmployeeForUser(
      session.user.id,
      session.user.name ?? undefined,
      session.user.email ?? undefined,
    );
    if (!employee) {
      return { success: false as const, error: "ไม่สามารถค้นหาหรือสร้างโปรไฟล์พนักงานได้" };
    }

    const startDate = new Date(rawData.startDate);
    const endDate = new Date(rawData.endDate);
    const fiscal = computeFiscalFields(startDate, endDate);

    const spRequested = rawData.salesPromotionBudgetRequested ?? 0;
    const mktRequested = rawData.marketingBudgetRequested ?? 0;
    const totalRequested =
      rawData.totalBudgetRequested ?? spRequested + mktRequested;

    const primaryCode = "TYPE_1";
    const resolvedPrimaryTypeId = await resolveActivityTypeId(primaryCode);

    const plan = await db.$transaction(async (tx) => {
      const code = await generateActivityPlanCode(tx, startDate);

      // 1. Create header ActivityPlan
      const createdPlan = await tx.activityPlan.create({
        data: {
          code,
          title: rawData.title,
          startDate,
          endDate,
          durationDays: fiscal.durationDays,
          fiscalYear: fiscal.fiscalYear,
          fiscalMonth: fiscal.fiscalMonth,
          fiscalQuarter: fiscal.fiscalQuarter,
          activityTypeId: resolvedPrimaryTypeId,
          planType: rawData.planType ?? ActivityPlanType.PLANNED,
          location: rawData.location ? String(rawData.location).trim() || null : null,
          province: rawData.province ?? null,
          district: rawData.district ?? null,
          objective: rawData.objective || "",
          description: rawData.description ?? null,
          notes: rawData.notes ?? null,
          salesPromotionBudgetRequested: rawData.salesPromotionBudgetRequested
            ? new Prisma.Decimal(rawData.salesPromotionBudgetRequested)
            : null,
          marketingBudgetRequested: rawData.marketingBudgetRequested
            ? new Prisma.Decimal(rawData.marketingBudgetRequested)
            : null,
          totalBudgetRequested: new Prisma.Decimal(totalRequested),
          hasProductWithdrawal: rawData.hasProductWithdrawal ?? false,
          status: ActivityStatus.DRAFT,
          employeeId: employee.id,
          createdById: session.user.id,
          currentApproverEmployeeId: employee.managerId ?? null,
        },
      });

      // 2. Create Join Table (Work Types)
      await tx.activityPlanWorkType.create({
        data: {
          activityPlanId: createdPlan.id,
          activityTypeId: resolvedPrimaryTypeId,
        },
      });

      // 3. Save Helpers if any
      if (Array.isArray(rawData.helperEmployeeIds) && rawData.helperEmployeeIds.length > 0) {
        await tx.activityHelper.createMany({
          data: rawData.helperEmployeeIds.map((empId: string) => ({
            activityPlanId: createdPlan.id,
            employeeId: empId,
            status: "PENDING",
          })),
        });
      }

      // 4. Save Type 1 targets directly to dedicated table activity_plan_type_1_stores
      if (rawData.planType === "UNPLANNED") {
        await type1UnplannedStrategy.savePlan(tx, createdPlan.id, rawData);
      } else {
        await type1PlannedStrategy.savePlan(tx, createdPlan.id, rawData);
      }

      return createdPlan;
    });

    revalidatePath("/activity-plans");
    return serialize({ success: true as const, plan });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

/**
 * Action: Update an Activity Plan (Self-contained in modules/activity)
 */
export async function updateActivityPlanAction(
  id: string,
  rawData: any
): Promise<PlanActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    const existing = await db.activityPlan.findUnique({
      where: { id },
      select: { id: true, createdById: true, status: true },
    });
    if (!existing) {
      return { success: false as const, error: "ไม่พบ Trip Plan ที่ต้องการแก้ไข" };
    }

    const startDate = new Date(rawData.startDate);
    const endDate = new Date(rawData.endDate);
    const fiscal = computeFiscalFields(startDate, endDate);

    const spRequested = rawData.salesPromotionBudgetRequested ?? 0;
    const mktRequested = rawData.marketingBudgetRequested ?? 0;
    const totalRequested =
      rawData.totalBudgetRequested ?? spRequested + mktRequested;

    const plan = await db.$transaction(async (tx) => {
      // 1. Update header ActivityPlan
      const updatedPlan = await tx.activityPlan.update({
        where: { id },
        data: {
          title: rawData.title,
          startDate,
          endDate,
          durationDays: fiscal.durationDays,
          fiscalYear: fiscal.fiscalYear,
          fiscalMonth: fiscal.fiscalMonth,
          fiscalQuarter: fiscal.fiscalQuarter,
          location: rawData.location ? String(rawData.location).trim() || null : null,
          province: rawData.province ?? null,
          district: rawData.district ?? null,
          notes: rawData.notes ?? null,
          salesPromotionBudgetRequested: rawData.salesPromotionBudgetRequested
            ? new Prisma.Decimal(rawData.salesPromotionBudgetRequested)
            : null,
          marketingBudgetRequested: rawData.marketingBudgetRequested
            ? new Prisma.Decimal(rawData.marketingBudgetRequested)
            : null,
          totalBudgetRequested: new Prisma.Decimal(totalRequested),
        },
      });

      // 2. Update Helpers
      if (Array.isArray(rawData.helperEmployeeIds)) {
        await tx.activityHelper.deleteMany({
          where: { activityPlanId: id },
        });
        if (rawData.helperEmployeeIds.length > 0) {
          await tx.activityHelper.createMany({
            data: rawData.helperEmployeeIds.map((empId: string) => ({
              activityPlanId: id,
              employeeId: empId,
              status: "PENDING",
            })),
          });
        }
      }

      // 3. Save Type 1 targets
      if (rawData.planType === "UNPLANNED") {
        await type1UnplannedStrategy.savePlan(tx, id, rawData);
      } else {
        await type1PlannedStrategy.savePlan(tx, id, rawData);
      }

      return updatedPlan;
    });

    revalidatePath("/activity-plans");
    revalidatePath(`/activity-plans/${id}`);
    return serialize({ success: true as const, plan });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" };
  }
}

/**
 * Action: Get Activity Plan with full relations
 */
export async function getActivityPlanAction(
  id: string
): Promise<PlanActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    const plan = await db.activityPlan.findUnique({
      where: { id },
      include: ACTIVITY_PLAN_FULL_INCLUDE,
    });
    if (!plan) {
      return { success: false as const, error: "ไม่พบข้อมูลแผนงาน" };
    }
    return serialize({ success: true as const, plan: plan as any });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน" };
  }
}

import { getApproverDirectory } from "../infrastructure/employee-lookup.repository";

/**
 * Action: Get Approver Directory
 */
export async function getApproverDirectoryAction() {
  try {
    const result = await getApproverDirectory();
    return serialize(result);
  } catch (err: any) {
    console.error("Failed to get approver directory:", err);
    return {
      salesAdminEmployees: [],
      marketingEmployees: [],
      salesDirectorEmployees: [],
    };
  }
}

// ─── Re-export standard helpers, workflows, & actions for modules/activity views ───
export {
  getCurrentUserEmployeeAction,
  getActivityTypesAction,
  getDemoPlotsAction,
  getProductCategoriesAction,
  getActivePromotionalMaterialsGroupedAction,
  getApprovalQueueDataAction,
  approveActivityPlanAction,
  rejectActivityPlanAction,
  requestCorrectionPlanAction,
  cancelActivityPlanAction,
  requestCancelActivityPlanAction,
  approveCancelActivityPlanAction,
  rejectCancelActivityPlanAction,
  deleteActivityPlanAction,
  submitActivityPlanAction,
  duplicateActivityPlanAction,
  reviewSingleActivityHelperAction,
  getActivityCalendarEventsAction,
  createPromotionalMaterialAction,
  updatePromotionalMaterialAction,
  deletePromotionalMaterialAction,
  getPromotionalMaterialsAction,
  getDistinctPromotionalCategoriesAction,
  recordActivityResultAction,
} from "@/modules/activity-plans/server/actions";
