"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { ActivityStatus } from "@prisma/client";
import { upsertActivityResult } from "../infrastructure/activity-result.repository";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export interface ActionResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
}

/**
 * Action: Record Activity Result (Actual) - Native Implementation
 */
export async function recordActivityResultAction(
  planId: string,
  rawData: any
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Fetch Plan to check existence and status
    const plan = await db.activityPlan.findUnique({
      where: { id: planId },
      include: {
        workTypes: { include: { activityType: true } },
        activityType: true,
      },
    });

    if (!plan) {
      return { success: false, error: "ไม่พบ Trip Plan" };
    }

    const isTestMode = process.env.NEXT_PUBLIC_ACTIVITY_PLAN_TEST_MODE === "true";
    if (plan.status !== ActivityStatus.APPROVED && !isTestMode) {
      return {
        success: false,
        error: "สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น",
      };
    }

    // 2. Ownership verification: ONLY creator or super admin can record results
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        employeeProfile: { select: { id: true } },
        userRoles: { select: { role: { select: { slug: true } } } },
      },
    });

    const isSuperAdmin = user?.userRoles?.some((r) =>
      ["administrator", "admin", "ceo"].includes(r.role.slug)
    );
    const isCreator =
      plan.createdById === session.user.id ||
      (user?.employeeProfile && plan.employeeId === user.employeeProfile.id);

    if (!isCreator && !isSuperAdmin) {
      return {
        success: false,
        error: "เฉพาะผู้สร้างแผนงาน (Creator) เท่านั้นที่มีสิทธิ์บันทึกผลการปฏิบัติงานจริง",
      };
    }

    // 3. Resolve plan work type codes
    const planWorkTypeCodes: string[] = [];
    if (plan.workTypes && plan.workTypes.length > 0) {
      for (const wt of plan.workTypes) {
        if (wt.activityType?.code) {
          planWorkTypeCodes.push(wt.activityType.code);
        }
      }
    }
    if (plan.activityType?.code && !planWorkTypeCodes.includes(plan.activityType.code)) {
      planWorkTypeCodes.push(plan.activityType.code);
    }

    const payload = rawData || {};

    const actualStartDate = payload.actualStartDate
      ? new Date(payload.actualStartDate)
      : plan.startDate;
    const actualEndDate = payload.actualEndDate
      ? new Date(payload.actualEndDate)
      : plan.endDate;

    // 4. Upsert ActivityResult and sync strategies inside atomic transaction
    const activityResult = await upsertActivityResult({
      activityPlanId: planId,
      actualStartDate,
      actualEndDate,
      actualAttendeesCount: payload.actualAttendeesCount ?? null,
      resultStatus: payload.resultStatus ?? "COMPLETED",
      resultSummary: payload.resultSummary ?? null,
      cancelReason: payload.cancelReason ?? null,
      postponedDate: payload.postponedDate ? new Date(payload.postponedDate) : null,
      postponedTime: payload.postponedTime ?? null,
      postponedReason: payload.postponedReason ?? null,
      postponedNotes: payload.postponedNotes ?? null,
      actualSalesPromotionSpent: payload.actualSalesPromotionSpent,
      actualMarketingSpent: payload.actualMarketingSpent,
      salesResultAmount: payload.salesResultAmount,
      salesOrdersCount: payload.salesOrdersCount,
      collectResultAmount: payload.collectResultAmount,
      demoPlotsCreated: payload.demoPlotsCreated,
      demoPlotsFollowedUp: payload.demoPlotsFollowedUp,
      distributorsCount: payload.distributorsCount,
      farmersCount: payload.farmersCount,
      recordedById: session.user.id,

      // Relation arrays
      saleResults: payload.saleResults,
      stockResults: payload.stockResults,
      surveyResults: payload.surveyResults,
      demoResults: payload.demoResults,
      followupResults: payload.followupResults,
      issueResults: payload.issueResults,
      attachments: payload.attachments,

      // Extra data for strategies
      ...payload,
      planWorkTypeCodes,
    });

    // 5. Revalidate cache
    revalidatePath("/activity-plans");
    revalidatePath(`/activity-plans/${planId}`);

    return serialize({ success: true, result: activityResult });
  } catch (err: any) {
    console.error("Failed to record activity result:", err);
    return {
      success: false,
      error: err.message || "เกิดข้อผิดพลาดไม่คาดคิดในการบันทึกผล",
    };
  }
}
