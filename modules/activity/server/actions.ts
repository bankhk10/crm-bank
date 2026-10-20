"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { Prisma, ActivityPlanType, ActivityStatus } from "@prisma/client";
import { type1PlannedStrategy } from "../features/type-1/planned/infrastructure/type1-planned.strategy";
import { type1UnplannedStrategy } from "../features/type-1/unplanned/infrastructure/type1-unplanned.strategy";
import { type2PlannedStrategy } from "../features/type-2/planned/infrastructure/type2-planned.strategy";
import { type2UnplannedStrategy } from "../features/type-2/unplanned/infrastructure/type2-unplanned.strategy";
import { type3PlannedStrategy } from "../features/type-3/planned/infrastructure/type3-planned.strategy";
import { type3UnplannedStrategy } from "../features/type-3/unplanned/infrastructure/type3-unplanned.strategy";
import { type4PlannedStrategy } from "../features/type-4/planned/infrastructure/type4-planned.strategy";
import { type4UnplannedStrategy } from "../features/type-4/unplanned/infrastructure/type4-unplanned.strategy";
import { ACTIVITY_PLAN_FULL_INCLUDE } from "../infrastructure/activity-plan-include";
import {
  generateActivityPlanCode,
  computeFiscalFields,
  resolveActivityTypeId,
} from "../infrastructure/activity-plan.repository";
import { findOrCreateEmployeeForUser } from "../infrastructure/employee-lookup.repository";
import { getWorkTypeCode } from "../constants";

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

    const hasType2 =
      (rawData.workTypeCodes &&
        (rawData.workTypeCodes.includes("TYPE_2") ||
          rawData.workTypeCodes.includes("ติดตามผลการใช้สินค้า"))) ||
      (rawData.planStores &&
        rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
      (rawData.type2Targets && rawData.type2Targets.length > 0);

    const hasType3 =
      (rawData.workTypeCodes &&
        (rawData.workTypeCodes.includes("TYPE_3") ||
          rawData.workTypeCodes.includes("เสนอขายสินค้า"))) ||
      (rawData.planStores &&
        rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
      (rawData.type3Targets && rawData.type3Targets.length > 0) ||
      (rawData.type3Items && rawData.type3Items.length > 0);

    const hasType1 =
      (rawData.workTypeCodes &&
        (rawData.workTypeCodes.includes("TYPE_1") ||
          rawData.workTypeCodes.includes("เข้าพบร้านค้า / Key Farmer"))) ||
      (rawData.planStores &&
        rawData.planStores.some((s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_1")) ||
      (rawData.type1Stores && rawData.type1Stores.length > 0);

    let primaryCode = "TYPE_1";
    if (Array.isArray(rawData.workTypeCodes) && rawData.workTypeCodes.length > 0) {
      primaryCode = getWorkTypeCode(rawData.workTypeCodes[0]);
    } else if (Array.isArray(rawData.workTypes) && rawData.workTypes.length > 0) {
      primaryCode = getWorkTypeCode(rawData.workTypes[0]);
    } else if (hasType2 && !hasType1) {
      primaryCode = "TYPE_2";
    } else if (hasType3 && !hasType1 && !hasType2) {
      primaryCode = "TYPE_3";
    } else if (rawData.activityTypeId) {
      primaryCode = getWorkTypeCode(rawData.activityTypeId);
    }

    const resolvedPrimaryTypeId = await resolveActivityTypeId(
      rawData.activityTypeId || primaryCode,
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

      // 4. Save Type 1 targets directly to dedicated table activity_plan_type_1_stores
      const hasType1 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_1") ||
            rawData.workTypeCodes.includes("เข้าพบร้านค้า / Key Farmer"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_1")) ||
        (rawData.type1Stores && rawData.type1Stores.length > 0);

      if (hasType1) {
        if (rawData.planType === "UNPLANNED") {
          await type1UnplannedStrategy.savePlan(tx, createdPlan.id, rawData);
        } else {
          await type1PlannedStrategy.savePlan(tx, createdPlan.id, rawData);
        }
      }

      // 5. Save Type 2 targets directly to dedicated table activity_plan_type_2_targets
      const hasType2 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_2") ||
            rawData.workTypeCodes.includes("ติดตามผลการใช้สินค้า"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
        (rawData.type2Targets && rawData.type2Targets.length > 0);

      if (hasType2) {
        if (rawData.planType === "UNPLANNED") {
          await type2UnplannedStrategy.savePlan(tx, createdPlan.id, rawData);
        } else {
          await type2PlannedStrategy.savePlan(tx, createdPlan.id, rawData);
        }
      }

      // 6. Save Type 3 targets directly to dedicated table activity_plan_type_3_targets
      const hasType3 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_3") ||
            rawData.workTypeCodes.includes("เสนอขายสินค้า"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
        (rawData.type3Targets && rawData.type3Targets.length > 0) ||
        (rawData.type3Items && rawData.type3Items.length > 0);

      if (hasType3) {
        if (rawData.planType === "UNPLANNED") {
          await type3UnplannedStrategy.savePlan(tx, createdPlan.id, rawData);
        } else {
          await type3PlannedStrategy.savePlan(tx, createdPlan.id, rawData);
        }
      }

      // 7. Save Type 4 targets directly to dedicated table activity_plan_type_4_targets
      const hasType4 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_4") ||
            rawData.workTypeCodes.includes("วางบิล / เก็บเงิน"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_4")) ||
        (rawData.type4Targets && rawData.type4Targets.length > 0) ||
        (rawData.type4Items && rawData.type4Items.length > 0);

      if (hasType4) {
        if (rawData.planType === "UNPLANNED") {
          await type4UnplannedStrategy.savePlan(tx, createdPlan.id, rawData);
        } else {
          await type4PlannedStrategy.savePlan(tx, createdPlan.id, rawData);
        }
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

    const hasType2 =
      (rawData.workTypeCodes &&
        (rawData.workTypeCodes.includes("TYPE_2") ||
          rawData.workTypeCodes.includes("ติดตามผลการใช้สินค้า"))) ||
      (rawData.planStores &&
        rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
      (rawData.type2Targets && rawData.type2Targets.length > 0);

    const hasType3 =
      (rawData.workTypeCodes &&
        (rawData.workTypeCodes.includes("TYPE_3") ||
          rawData.workTypeCodes.includes("เสนอขายสินค้า"))) ||
      (rawData.planStores &&
        rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
      (rawData.type3Targets && rawData.type3Targets.length > 0) ||
      (rawData.type3Items && rawData.type3Items.length > 0);

    const hasType1 =
      (rawData.workTypeCodes &&
        (rawData.workTypeCodes.includes("TYPE_1") ||
          rawData.workTypeCodes.includes("เข้าพบร้านค้า / Key Farmer"))) ||
      (rawData.planStores &&
        rawData.planStores.some((s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_1")) ||
      (rawData.type1Stores && rawData.type1Stores.length > 0);

    let primaryCode = "TYPE_1";
    if (Array.isArray(rawData.workTypeCodes) && rawData.workTypeCodes.length > 0) {
      primaryCode = getWorkTypeCode(rawData.workTypeCodes[0]);
    } else if (Array.isArray(rawData.workTypes) && rawData.workTypes.length > 0) {
      primaryCode = getWorkTypeCode(rawData.workTypes[0]);
    } else if (hasType2 && !hasType1) {
      primaryCode = "TYPE_2";
    } else if (hasType3 && !hasType1 && !hasType2) {
      primaryCode = "TYPE_3";
    } else if (rawData.activityTypeId) {
      primaryCode = getWorkTypeCode(rawData.activityTypeId);
    }

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

      // 3. Save Type 1 targets
      const hasType1 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_1") ||
            rawData.workTypeCodes.includes("เข้าพบร้านค้า / Key Farmer"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_1")) ||
        (rawData.type1Stores && rawData.type1Stores.length > 0);

      if (hasType1) {
        if (rawData.planType === "UNPLANNED") {
          await type1UnplannedStrategy.savePlan(tx, id, rawData);
        } else {
          await type1PlannedStrategy.savePlan(tx, id, rawData);
        }
      }

      // 4. Save Type 2 targets
      const hasType2 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_2") ||
            rawData.workTypeCodes.includes("ติดตามผลการใช้สินค้า"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
        (rawData.type2Targets && rawData.type2Targets.length > 0);

      if (hasType2) {
        if (rawData.planType === "UNPLANNED") {
          await type2UnplannedStrategy.savePlan(tx, id, rawData);
        } else {
          await type2PlannedStrategy.savePlan(tx, id, rawData);
        }
      }

      // 5. Save Type 3 targets
      const hasType3 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_3") ||
            rawData.workTypeCodes.includes("เสนอขายสินค้า"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
        (rawData.type3Targets && rawData.type3Targets.length > 0) ||
        (rawData.type3Items && rawData.type3Items.length > 0);

      if (hasType3) {
        if (rawData.planType === "UNPLANNED") {
          await type3UnplannedStrategy.savePlan(tx, id, rawData);
        } else {
          await type3PlannedStrategy.savePlan(tx, id, rawData);
        }
      }

      // 6. Save Type 4 targets
      const hasType4 =
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_4") ||
            rawData.workTypeCodes.includes("วางบิล / เก็บเงิน"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_4")) ||
        (rawData.type4Targets && rawData.type4Targets.length > 0) ||
        (rawData.type4Items && rawData.type4Items.length > 0);

      if (hasType4) {
        if (rawData.planType === "UNPLANNED") {
          await type4UnplannedStrategy.savePlan(tx, id, rawData);
        } else {
          await type4PlannedStrategy.savePlan(tx, id, rawData);
        }
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

import * as legacyActions from "@/modules/activity-plans/server/actions";

// ─── Async wrapper actions compliant with Next.js 16 'use server' boundary ───
export async function getCurrentUserEmployeeAction(
  ...args: Parameters<typeof legacyActions.getCurrentUserEmployeeAction>
) {
  return legacyActions.getCurrentUserEmployeeAction(...args);
}

export async function getActivityTypesAction(
  ...args: Parameters<typeof legacyActions.getActivityTypesAction>
) {
  return legacyActions.getActivityTypesAction(...args);
}

export async function getDemoPlotsAction(
  ...args: Parameters<typeof legacyActions.getDemoPlotsAction>
) {
  return legacyActions.getDemoPlotsAction(...args);
}

export async function getProductCategoriesAction(
  ...args: Parameters<typeof legacyActions.getProductCategoriesAction>
) {
  return legacyActions.getProductCategoriesAction(...args);
}

export async function getActivePromotionalMaterialsGroupedAction(
  ...args: Parameters<typeof legacyActions.getActivePromotionalMaterialsGroupedAction>
) {
  return legacyActions.getActivePromotionalMaterialsGroupedAction(...args);
}

export async function getApprovalQueueDataAction(
  ...args: Parameters<typeof legacyActions.getApprovalQueueDataAction>
) {
  return legacyActions.getApprovalQueueDataAction(...args);
}

export async function approveActivityPlanAction(
  ...args: Parameters<typeof legacyActions.approveActivityPlanAction>
) {
  return legacyActions.approveActivityPlanAction(...args);
}

export async function rejectActivityPlanAction(
  ...args: Parameters<typeof legacyActions.rejectActivityPlanAction>
) {
  return legacyActions.rejectActivityPlanAction(...args);
}

export async function requestCorrectionPlanAction(
  ...args: Parameters<typeof legacyActions.requestCorrectionPlanAction>
) {
  return legacyActions.requestCorrectionPlanAction(...args);
}

export async function cancelActivityPlanAction(
  ...args: Parameters<typeof legacyActions.cancelActivityPlanAction>
) {
  return legacyActions.cancelActivityPlanAction(...args);
}

export async function requestCancelActivityPlanAction(
  ...args: Parameters<typeof legacyActions.requestCancelActivityPlanAction>
) {
  return legacyActions.requestCancelActivityPlanAction(...args);
}

export async function approveCancelActivityPlanAction(
  ...args: Parameters<typeof legacyActions.approveCancelActivityPlanAction>
) {
  return legacyActions.approveCancelActivityPlanAction(...args);
}

export async function rejectCancelActivityPlanAction(
  ...args: Parameters<typeof legacyActions.rejectCancelActivityPlanAction>
) {
  return legacyActions.rejectCancelActivityPlanAction(...args);
}

export async function deleteActivityPlanAction(
  ...args: Parameters<typeof legacyActions.deleteActivityPlanAction>
) {
  return legacyActions.deleteActivityPlanAction(...args);
}

export async function submitActivityPlanAction(
  ...args: Parameters<typeof legacyActions.submitActivityPlanAction>
) {
  return legacyActions.submitActivityPlanAction(...args);
}

export async function duplicateActivityPlanAction(
  ...args: Parameters<typeof legacyActions.duplicateActivityPlanAction>
) {
  return legacyActions.duplicateActivityPlanAction(...args);
}

export async function reviewSingleActivityHelperAction(
  ...args: Parameters<typeof legacyActions.reviewSingleActivityHelperAction>
) {
  return legacyActions.reviewSingleActivityHelperAction(...args);
}

export async function getActivityCalendarEventsAction(
  ...args: Parameters<typeof legacyActions.getActivityCalendarEventsAction>
) {
  return legacyActions.getActivityCalendarEventsAction(...args);
}

export async function createPromotionalMaterialAction(
  ...args: Parameters<typeof legacyActions.createPromotionalMaterialAction>
) {
  return legacyActions.createPromotionalMaterialAction(...args);
}

export async function updatePromotionalMaterialAction(
  ...args: Parameters<typeof legacyActions.updatePromotionalMaterialAction>
) {
  return legacyActions.updatePromotionalMaterialAction(...args);
}

export async function deletePromotionalMaterialAction(
  ...args: Parameters<typeof legacyActions.deletePromotionalMaterialAction>
) {
  return legacyActions.deletePromotionalMaterialAction(...args);
}

export async function getPromotionalMaterialsAction(
  ...args: Parameters<typeof legacyActions.getPromotionalMaterialsAction>
) {
  return legacyActions.getPromotionalMaterialsAction(...args);
}

export async function getDistinctPromotionalCategoriesAction(
  ...args: Parameters<typeof legacyActions.getDistinctPromotionalCategoriesAction>
) {
  return legacyActions.getDistinctPromotionalCategoriesAction(...args);
}

export async function recordActivityResultAction(
  ...args: Parameters<typeof legacyActions.recordActivityResultAction>
) {
  return legacyActions.recordActivityResultAction(...args);
}
