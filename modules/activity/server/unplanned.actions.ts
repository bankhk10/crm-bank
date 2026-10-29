"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { Prisma, ActivityPlanType, ActivityStatus } from "@prisma/client";
import { ACTIVITY_PLAN_FULL_INCLUDE } from "../infrastructure/activity-plan-include";
import {
  generateActivityPlanCode,
  computeFiscalFields,
  resolveActivityTypeId,
} from "../infrastructure/activity-plan.repository";
import { findOrCreateEmployeeForUser } from "../infrastructure/employee-lookup.repository";
import { syncActivityPlanToCalendarUseCase } from "../infrastructure/calendar-integration";
import {
  saveStrategiesForPlan,
  resolvePrimaryWorkTypeCode,
} from "../infrastructure/strategy.registry";
import { getWorkTypeCode } from "../constants";
import {
  canCreateUnplannedActivity,
  canEditActivityPlan,
} from "../domain/permissions";
import type { PlanActionResult } from "./types";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Action: Create an Unplanned Activity (2-in-1: Plan & Actual results combined)
 */
export async function createUnplannedActivityAction(
  rawData: any
): Promise<PlanActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const authCheck = canCreateUnplannedActivity(session.user);
  if (!authCheck.allowed) {
    return {
      success: false as const,
      error: authCheck.error || "Forbidden: คุณไม่มีสิทธิ์สร้างกิจกรรมนอกแผน",
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
      rawData.activityTypeId || primaryCode,
    );

    const workTypeCodes =
      Array.isArray(rawData.workTypeCodes) && rawData.workTypeCodes.length > 0
        ? rawData.workTypeCodes.map(getWorkTypeCode)
        : [primaryCode];

    const plan = await db.$transaction(async (tx) => {
      const code = await generateActivityPlanCode(tx, startDate);

      // 1. Create header ActivityPlan with UNPLANNED type
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
          planType: ActivityPlanType.UNPLANNED,
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

      // 4. Save Feature-specific unplanned data & results via Strategy Registry
      await saveStrategiesForPlan(tx, createdPlan.id, {
        ...rawData,
        planType: "UNPLANNED",
      });

      // 5. Sync to Calendar immediately as completed event
      await syncActivityPlanToCalendarUseCase(
        {
          id: createdPlan.id,
          title: createdPlan.title,
          description: createdPlan.description,
          objective: createdPlan.objective,
          location: createdPlan.location,
          province: createdPlan.province,
          district: createdPlan.district,
          startDate: createdPlan.startDate,
          endDate: createdPlan.endDate,
          createdById: createdPlan.createdById,
          employeeId: createdPlan.employeeId,
          planType: createdPlan.planType,
          status: createdPlan.status,
        },
        tx,
      );

      return createdPlan;
    });

    revalidatePath("/activity-plans");
    revalidatePath("/activity-plans/calendar");
    return serialize({ success: true as const, plan });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการบันทึกกิจกรรมนอกแผน" };
  }
}

/**
 * Action: Update an Unplanned Activity
 */
export async function updateUnplannedActivityAction(
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
      select: { id: true, createdById: true, employeeId: true, status: true },
    });
    if (!existing) {
      return { success: false as const, error: "ไม่พบกิจกรรมนอกแผนที่ต้องการแก้ไข" };
    }

    const editCheck = canEditActivityPlan(session.user, existing);
    if (!editCheck.allowed) {
      return { success: false as const, error: editCheck.error || "คุณไม่มีสิทธิ์แก้ไขกิจกรรมนอกแผนนี้" };
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
      rawData.activityTypeId || primaryCode,
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

      // 3. Save Feature-specific data via Strategy Registry
      await saveStrategiesForPlan(tx, id, {
        ...rawData,
        planType: "UNPLANNED",
      });

      // 4. Sync updated data to Calendar
      await syncActivityPlanToCalendarUseCase(
        {
          id: updatedPlan.id,
          title: updatedPlan.title,
          description: updatedPlan.description,
          objective: updatedPlan.objective,
          location: updatedPlan.location,
          province: updatedPlan.province,
          district: updatedPlan.district,
          startDate: updatedPlan.startDate,
          endDate: updatedPlan.endDate,
          createdById: updatedPlan.createdById,
          employeeId: updatedPlan.employeeId,
          planType: updatedPlan.planType,
          status: updatedPlan.status,
        },
        tx,
      );

      return updatedPlan;
    });

    revalidatePath("/activity-plans");
    revalidatePath(`/activity-plans/${id}`);
    revalidatePath("/activity-plans/calendar");
    return serialize({ success: true as const, plan });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการแก้ไขกิจกรรมนอกแผน" };
  }
}

/**
 * Action: Get Unplanned Activity detail with full relations
 */
export async function getUnplannedActivityAction(
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
      return { success: false as const, error: "ไม่พบข้อมูลกิจกรรมนอกแผน" };
    }
    return serialize({ success: true as const, plan: plan as any });
  } catch (err: any) {
    return { success: false as const, error: err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลกิจกรรมนอกแผน" };
  }
}
