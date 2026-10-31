"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { Prisma, ActivityPlanType, ActivityStatus, DemoPlotStatus, CalendarEventStatus } from "@prisma/client";
import { ACTIVITY_PLAN_FULL_INCLUDE } from "../infrastructure/activity-plan-include";
import {
  generateActivityPlanCode,
  computeFiscalFields,
  resolveActivityTypeId,
  findActivityTypes,
} from "../infrastructure/activity-plan.repository";
import { findOrCreateEmployeeForUser } from "../infrastructure/employee-lookup.repository";
import { getAvailableDemoPlots } from "../infrastructure/demo-plot.repository";
import {
  saveStrategiesForPlan,
  resolvePrimaryWorkTypeCode,
} from "../infrastructure/strategy.registry";
import { getWorkTypeCode } from "../constants";
import {
  submitActivityPlanUseCase,
  cancelActivityPlanUseCase,
  requestCancelActivityPlanUseCase,
  approveCancelActivityPlanUseCase,
  rejectCancelActivityPlanUseCase,
} from "../application/activity-plan-flow";
import { getActivityCalendarEventsAction } from "./calendar.actions";
import {
  findDealerAndSubdealerCustomerOptions,
  findFarmerCustomerOptions,
} from "../infrastructure/customer-lookup.repository";
import { findFollowUpActivityPlans } from "../features/type-7b/planned/infrastructure/type7b.repository";
import { findHattackFollowUpActivityPlans } from "../features/type-14/planned/infrastructure/type14.repository";
import {
  createUnplannedActivityAction,
  updateUnplannedActivityAction,
} from "./unplanned.actions";
import {
  canCreatePlannedActivity,
  canEditActivityPlan,
  canDeleteActivityPlan,
} from "../domain/permissions";
import type { PlanActionResult } from "./types";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Action: Create an Activity Plan (Planned)
 * Delegates to createUnplannedActivityAction if rawData.planType === "UNPLANNED"
 */
export async function createActivityPlanAction(rawData: any): Promise<PlanActionResult> {
  if (rawData?.planType === "UNPLANNED") {
    return createUnplannedActivityAction(rawData);
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const authCheck = canCreatePlannedActivity(session.user);
  if (!authCheck.allowed) {
    return {
      success: false as const,
      error: authCheck.error || "Forbidden: คุณไม่มีสิทธิ์สร้าง Trip Plan",
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

    const primaryCode = resolvePrimaryWorkTypeCode(rawData);
    const resolvedPrimaryTypeId = await resolveActivityTypeId(
      primaryCode || rawData.activityTypeId,
    );

    const workTypeCodes =
      Array.isArray(rawData.workTypeCodes) && rawData.workTypeCodes.length > 0
        ? rawData.workTypeCodes.map(getWorkTypeCode)
        : [primaryCode];

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
          targetAttendeesCount:
            rawData.targetAttendeesCount != null
              ? Number(rawData.targetAttendeesCount)
              : null,
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
      for (const wtCode of workTypeCodes) {
        const wtId = await resolveActivityTypeId(wtCode, tx);
        await tx.activityPlanWorkType.create({
          data: {
            activityPlanId: createdPlan.id,
            activityTypeId: wtId,
          },
        });
      }

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

      // 3.1 Save Marketing Items (สื่อส่งเสริมการขาย)
      if (Array.isArray(rawData.marketingItems) && rawData.marketingItems.length > 0) {
        await tx.activityPlanMarketingItem.createMany({
          data: rawData.marketingItems.map((item: any) => ({
            activityPlanId: createdPlan.id,
            category: String(item.category || "อื่นๆ"),
            materialName: String(item.materialName || ""),
            unit: item.unit ? String(item.unit) : "ชิ้น",
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
            quantity: Number(item.quantity || 1),
            totalAmount: new Prisma.Decimal(
              item.totalAmount != null
                ? item.totalAmount
                : Number(item.quantity || 1) * Number(item.unitPrice || 0),
            ),
          })),
        });
      }

      // 3.2 Save Promotion Items (รายการส่งเสริมการขาย)
      if (Array.isArray(rawData.promotionItems) && rawData.promotionItems.length > 0) {
        await tx.activityPlanPromotionItem.createMany({
          data: rawData.promotionItems.map((item: any) => ({
            activityPlanId: createdPlan.id,
            budgetType: String(item.budgetType || "งบการตลาด"),
            detail: String(item.detail || ""),
            amount: new Prisma.Decimal(item.amount || 0),
          })),
        });
      }

      // 4. Save Feature-specific target items via Strategy Registry
      await saveStrategiesForPlan(tx, createdPlan.id, {
        ...rawData,
        planType: "PLANNED",
      });

      return createdPlan;
    });

    revalidatePath("/activity-plans");
    return serialize({ success: true as const, plan });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

/**
 * Explicit alias for planned creation
 */
export const createPlannedActivityAction = createActivityPlanAction;

/**
 * Action: Update an Activity Plan (Planned)
 * Delegates to updateUnplannedActivityAction if rawData.planType === "UNPLANNED"
 */
export async function updateActivityPlanAction(
  id: string,
  rawData: any
): Promise<PlanActionResult> {
  if (rawData?.planType === "UNPLANNED") {
    return updateUnplannedActivityAction(id, rawData);
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    const existing = await db.activityPlan.findUnique({
      where: { id },
      select: { id: true, createdById: true, employeeId: true, status: true, planType: true },
    });
    if (!existing) {
      return { success: false as const, error: "ไม่พบ Trip Plan ที่ต้องการแก้ไข" };
    }

    const editCheck = canEditActivityPlan(session.user, existing);
    if (!editCheck.allowed) {
      return { success: false as const, error: editCheck.error || "คุณไม่มีสิทธิ์แก้ไข Trip Plan นี้" };
    }

    if (existing.planType === ActivityPlanType.UNPLANNED) {
      return updateUnplannedActivityAction(id, rawData);
    }

    const startDate = new Date(rawData.startDate);
    const endDate = new Date(rawData.endDate);
    const fiscal = computeFiscalFields(startDate, endDate);

    const spRequested = rawData.salesPromotionBudgetRequested ?? 0;
    const mktRequested = rawData.marketingBudgetRequested ?? 0;
    const totalRequested =
      rawData.totalBudgetRequested ?? spRequested + mktRequested;

    const primaryCode = resolvePrimaryWorkTypeCode(rawData);
    const resolvedPrimaryTypeId = await resolveActivityTypeId(
      primaryCode || rawData.activityTypeId,
    );

    const workTypeCodes =
      Array.isArray(rawData.workTypeCodes) && rawData.workTypeCodes.length > 0
        ? rawData.workTypeCodes.map(getWorkTypeCode)
        : [primaryCode];

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
          activityTypeId: resolvedPrimaryTypeId,
          location: rawData.location ? String(rawData.location).trim() || null : null,
          province: rawData.province ?? null,
          district: rawData.district ?? null,
          notes: rawData.notes ?? null,
          targetAttendeesCount:
            rawData.targetAttendeesCount !== undefined
              ? rawData.targetAttendeesCount != null
                ? Number(rawData.targetAttendeesCount)
                : null
              : undefined,
          salesPromotionBudgetRequested: rawData.salesPromotionBudgetRequested
            ? new Prisma.Decimal(rawData.salesPromotionBudgetRequested)
            : null,
          marketingBudgetRequested: rawData.marketingBudgetRequested
            ? new Prisma.Decimal(rawData.marketingBudgetRequested)
            : null,
          totalBudgetRequested: new Prisma.Decimal(totalRequested),
        },
      });

      // 1.1 Update Join Table (Work Types)
      if (workTypeCodes.length > 0) {
        await tx.activityPlanWorkType.deleteMany({
          where: { activityPlanId: id },
        });
        for (const wtCode of workTypeCodes) {
          const wtId = await resolveActivityTypeId(wtCode, tx);
          await tx.activityPlanWorkType.create({
            data: {
              activityPlanId: id,
              activityTypeId: wtId,
            },
          });
        }
      }

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

      // 2.1 Update Marketing Items (สื่อส่งเสริมการขาย)
      await tx.activityPlanMarketingItem.deleteMany({
        where: { activityPlanId: id },
      });
      if (Array.isArray(rawData.marketingItems) && rawData.marketingItems.length > 0) {
        await tx.activityPlanMarketingItem.createMany({
          data: rawData.marketingItems.map((item: any) => ({
            activityPlanId: id,
            category: String(item.category || "อื่นๆ"),
            materialName: String(item.materialName || ""),
            unit: item.unit ? String(item.unit) : "ชิ้น",
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
            quantity: Number(item.quantity || 1),
            totalAmount: new Prisma.Decimal(
              item.totalAmount != null
                ? item.totalAmount
                : Number(item.quantity || 1) * Number(item.unitPrice || 0),
            ),
          })),
        });
      }

      // 2.2 Update Promotion Items (รายการส่งเสริมการขาย)
      await tx.activityPlanPromotionItem.deleteMany({
        where: { activityPlanId: id },
      });
      if (Array.isArray(rawData.promotionItems) && rawData.promotionItems.length > 0) {
        await tx.activityPlanPromotionItem.createMany({
          data: rawData.promotionItems.map((item: any) => ({
            activityPlanId: id,
            budgetType: String(item.budgetType || "งบการตลาด"),
            detail: String(item.detail || ""),
            amount: new Prisma.Decimal(item.amount || 0),
          })),
        });
      }

      // 3. Save Feature-specific target items via Strategy Registry
      await saveStrategiesForPlan(tx, id, {
        ...rawData,
        planType: "PLANNED",
      });

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
 * Explicit alias for planned update
 */
export const updatePlannedActivityAction = updateActivityPlanAction;

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

    const roles = session.user.roles ?? [];
    const isAdmin =
      roles.includes("administrator") ||
      roles.includes("admin") ||
      roles.includes("ceo") ||
      (session.user as any)?.role === "administrator" ||
      (session.user as any)?.role === "ADMIN";

    const isOwner =
      plan.createdById === session.user.id ||
      (session.user.employeeId && plan.employeeId === session.user.employeeId);

    if (plan.status === ActivityStatus.DRAFT && !isOwner && !isAdmin) {
      return {
        success: false as const,
        error: "แผนงานอยู่ในสถานะร่าง เฉพาะผู้จัดทำแผนเท่านั้นที่สามารถเข้าถึงได้",
      };
    }

    return serialize({ success: true as const, plan: plan as any });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน" };
  }
}

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
        positionTitle: (employee as any).positionTitle || (employee as any).position?.name,
        departmentName: (employee as any).departmentName || (employee as any).department?.name,
      },
    });
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน",
    };
  }
}

export async function getActivityTypesAction() {
  try {
    const types = await findActivityTypes();
    return serialize({ success: true, types });
  } catch (err: any) {
    return serialize({ success: false, types: [], error: err.message });
  }
}

export async function getDemoPlotsAction() {
  try {
    const demoPlots = await getAvailableDemoPlots();
    return serialize({ success: true, demoPlots });
  } catch (err: any) {
    console.error("Failed to get demo plots:", err);
    return serialize({ success: false, demoPlots: [], error: err.message });
  }
}

export async function getFollowUpPlansAction(targetEmployeeId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return serialize({ success: false, followUpPlans: [], error: "Unauthorized" });
    }

    let employeeId = targetEmployeeId || session.user.employeeId;
    if (!employeeId && session.user.id) {
      const emp = await db.employee.findFirst({
        where: { userId: session.user.id, deletedAt: null },
        select: { id: true },
      });
      if (emp) {
        employeeId = emp.id;
      }
    }

    const followUpPlans = await findFollowUpActivityPlans({
      employeeId: employeeId ?? undefined,
      userId: session.user.id,
    });
    return serialize({ success: true, followUpPlans });
  } catch (err: any) {
    console.error("Failed to get follow-up plans:", err);
    return serialize({ success: false, followUpPlans: [], error: err.message });
  }
}

export async function getHattackFollowUpPlansAction(targetEmployeeId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return serialize({
        success: false,
        hattackFollowUpPlans: [],
        error: "Unauthorized",
      });
    }

    let employeeId = targetEmployeeId || session.user.employeeId;
    if (!employeeId && session.user.id) {
      const emp = await db.employee.findFirst({
        where: { userId: session.user.id, deletedAt: null },
        select: { id: true },
      });
      if (emp) {
        employeeId = emp.id;
      }
    }

    const hattackFollowUpPlans = await findHattackFollowUpActivityPlans({
      employeeId: employeeId ?? undefined,
      userId: session.user.id,
    });
    return serialize({ success: true, hattackFollowUpPlans });
  } catch (err: any) {
    console.error("Failed to get hattack follow-up plans:", err);
    return serialize({
      success: false,
      hattackFollowUpPlans: [],
      error: err.message,
    });
  }
}

export async function getProductCategoriesAction() {
  try {
    const productCategories = await db.productCategory.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        description: true,
      },
    });
    return serialize({ success: true, productCategories });
  } catch (err: any) {
    console.error("Failed to get product categories:", err);
    return serialize({ success: false, productCategories: [] });
  }
}

export async function cancelActivityPlanAction(id: string, reason?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await cancelActivityPlanUseCase(id, session.user.id, reason);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

export async function requestCancelActivityPlanAction(id: string, reason: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await requestCancelActivityPlanUseCase(id, session.user.id, reason);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

export async function approveCancelActivityPlanAction(id: string, comment?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await approveCancelActivityPlanUseCase(id, session.user.id, comment);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

export async function rejectCancelActivityPlanAction(id: string, comment?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await rejectCancelActivityPlanUseCase(id, session.user.id, comment);
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

export async function deleteActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const plan = await db.activityPlan.findUnique({
      where: { id },
      select: { id: true, createdById: true, employeeId: true, status: true },
    });
    if (!plan) return { success: false, error: "ไม่พบแผนกิจกรรม" };

    const deleteCheck = canDeleteActivityPlan(session.user, plan);
    if (!deleteCheck.allowed) {
      return { success: false, error: deleteCheck.error || "คุณไม่มีสิทธิ์ลบแผนกิจกรรมนี้" };
    }

    const now = new Date();
    await db.$transaction([
      db.activityPlan.update({
        where: { id },
        data: { deletedAt: now, status: ActivityStatus.CANCELLED },
      }),
      db.activityCalendarEvent.updateMany({
        where: { activityPlanId: id },
        data: { deletedAt: now, status: CalendarEventStatus.CANCELLED },
      }),
      db.activityPlanType7aTarget.updateMany({
        where: { activityPlanId: id },
        data: { status: DemoPlotStatus.CANCELLED },
      }),
      db.activityPlanType13Target.updateMany({
        where: { activityPlanId: id },
        data: { status: DemoPlotStatus.CANCELLED },
      }),
    ]);
    revalidatePath("/activity-plans");
    revalidatePath("/activity-plans/calendar");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการลบแผนงาน" };
  }
}

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
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

export async function batchSubmitActivityPlansAction(ids: string[]) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return { success: false, error: "ไม่ได้ระบุแผนงานที่ต้องการส่ง" };
  }

  const results: { id: string; success: boolean; error?: string }[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const id of ids) {
    try {
      const res = await submitActivityPlanUseCase(id, session.user.id);
      if (res.success) {
        successCount++;
        results.push({ id, success: true });
        revalidatePath(`/activity-plans/${id}`);
      } else {
        failureCount++;
        results.push({
          id,
          success: false,
          error: res.error || "เกิดข้อผิดพลาดในการส่งขออนุมัติ",
        });
      }
    } catch (err: any) {
      failureCount++;
      results.push({
        id,
        success: false,
        error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด",
      });
    }
  }

  if (successCount > 0) {
    revalidatePath("/activity-plans");
    revalidatePath("/activity-plans/approvals");
    revalidatePath("/activity-plans/calendar");
  }

  return serialize({
    success: successCount > 0,
    total: ids.length,
    successCount,
    failureCount,
    results,
  });
}

export async function duplicateActivityPlanAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const originalPlan = await db.activityPlan.findUnique({
      where: { id },
      include: ACTIVITY_PLAN_FULL_INCLUDE,
    });
    if (!originalPlan) {
      return { success: false, error: "ไม่พบ Trip Plan ต้นฉบับที่ต้องการทำสำเนา" };
    }

    const duplicated = await createActivityPlanAction({
      title: `${originalPlan.title} (สำเนา)`,
      startDate: originalPlan.startDate,
      endDate: originalPlan.endDate,
      activityTypeId: originalPlan.activityTypeId,
      location: originalPlan.location,
      province: originalPlan.province,
      district: originalPlan.district,
      notes: originalPlan.notes,
      planType: originalPlan.planType,
      salesPromotionBudgetRequested: originalPlan.salesPromotionBudgetRequested
        ? Number(originalPlan.salesPromotionBudgetRequested)
        : null,
      marketingBudgetRequested: originalPlan.marketingBudgetRequested
        ? Number(originalPlan.marketingBudgetRequested)
        : null,
      totalBudgetRequested: originalPlan.totalBudgetRequested
        ? Number(originalPlan.totalBudgetRequested)
        : null,
      workTypeCodes: (originalPlan.workTypes || [])
        .map((wt) => wt.activityType?.code)
        .filter(Boolean),
      helperEmployeeIds: (originalPlan.helpers || []).map((h) => h.employeeId),
      marketingItems: (originalPlan.marketingItems || []).map((m: any) => ({
        category: m.category,
        materialName: m.materialName,
        unit: m.unit,
        unitPrice: Number(m.unitPrice),
        quantity: m.quantity,
        totalAmount: Number(m.totalAmount),
      })),
      promotionItems: (originalPlan.promotionItems || []).map((p: any) => ({
        budgetType: p.budgetType,
        detail: p.detail,
        amount: Number(p.amount),
      })),
    });

    return serialize(duplicated);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการทำสำเนาแผนงาน" };
  }
}

export { getActivityCalendarEventsAction };

export async function getDealerAndSubdealerCustomerOptionsAction() {
  try {
    const stores = await findDealerAndSubdealerCustomerOptions();
    return serialize({ success: true as const, stores });
  } catch (err: any) {
    console.error("Failed to get dealer & subdealer customer options:", err);
    return serialize({ success: false as const, stores: [] });
  }
}

export async function getFarmerCustomerOptionsAction(province?: string) {
  try {
    const farmers = await findFarmerCustomerOptions(province);
    return serialize({ success: true as const, farmers });
  } catch (err: any) {
    console.error("Failed to get farmer customer options:", err);
    return serialize({ success: false as const, farmers: [] });
  }
}

export async function toggleHattackPlotStatusAction(params: {
  targetId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  closureNotes?: string | null;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    const isClosed = params.status === "COMPLETED";
    const updated = await db.activityPlanType13Target.update({
      where: { id: params.targetId },
      data: {
        status: isClosed ? DemoPlotStatus.COMPLETED : DemoPlotStatus.IN_PROGRESS,
        closedAt: isClosed ? new Date() : null,
        closureNotes: isClosed ? params.closureNotes || null : null,
      },
    });

    revalidatePath("/activity-plans");
    revalidatePath(`/activity-plans/${updated.activityPlanId}`);

    return serialize({ success: true as const, target: updated });
  } catch (err: any) {
    console.error("Failed to toggle Hattack plot status:", err);
    return {
      success: false as const,
      error: err.message || "เกิดข้อผิดพลาดในการปรับปรุงสถานะแปลงแฮตแทค",
    };
  }
}

export async function getRecentActivityPlansForExportAction(): Promise<{
  success: boolean;
  plans?: Array<{
    id: string;
    code: string | null;
    title: string;
    startDate: Date;
    endDate: Date;
    status: string;
    creatorName: string;
  }>;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const plans = await db.activityPlan.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        code: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        employee: {
          select: { firstName: true, lastName: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    return serialize({
      success: true,
      plans: plans.map((p) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        creatorName: p.employee
          ? `${p.employee.firstName || ""} ${p.employee.lastName || ""}`.trim()
          : p.createdBy?.name || "-",
      })),
    });
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการโหลดรายการแผนงาน" };
  }
}
