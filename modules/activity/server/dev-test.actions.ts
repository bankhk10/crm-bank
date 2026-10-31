"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { ActivityStatus } from "@prisma/client";
import { syncActivityPlanToCalendarUseCase } from "../infrastructure/calendar-integration";

function isAdministratorSession(user: any): boolean {
  if (!user) return false;
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  if (roles.some((r) => String(r).toLowerCase() === "administrator")) {
    return true;
  }
  if (typeof user.role === "string" && user.role.toLowerCase() === "administrator") {
    return true;
  }
  return false;
}

/**
 * Admin-only testing utility: Force-approves an ActivityPlan so the administrator
 * can immediately test the Actual Result (/activity-plans/[id]/actual) form
 * without going through multi-step approval workflows.
 */
export async function forceApproveActivityPlanForTestAction(planId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  if (!isAdministratorSession(session.user)) {
    return {
      success: false as const,
      error: "Forbidden: เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้นที่ใช้ฟีเจอร์ทดสอบนี้ได้",
    };
  }

  try {
    const existing = await db.activityPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return { success: false as const, error: "ไม่พบแผนงานที่ต้องการอนุมัติ" };
    }

    const updated = await db.$transaction(async (tx) => {
      const plan = await tx.activityPlan.update({
        where: { id: planId },
        data: {
          status: ActivityStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      await tx.activityHelper.updateMany({
        where: { activityPlanId: planId },
        data: { status: "APPROVED" },
      });

      await syncActivityPlanToCalendarUseCase(
        {
          id: plan.id,
          title: plan.title,
          description: plan.description,
          objective: plan.objective,
          location: plan.location,
          province: plan.province,
          district: plan.district,
          startDate: plan.startDate,
          endDate: plan.endDate,
          createdById: plan.createdById,
          employeeId: plan.employeeId,
          planType: plan.planType,
          status: plan.status,
        },
        tx,
      );

      return plan;
    });

    revalidatePath("/activity-plans");
    revalidatePath(`/activity-plans/${planId}`);
    revalidatePath(`/activity-plans/${planId}/edit`);
    revalidatePath(`/activity-plans/${planId}/actual`);

    return {
      success: true as const,
      status: updated.status,
    };
  } catch (err: any) {
    return {
      success: false as const,
      error: err?.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะแผนงานเป็น APPROVED",
    };
  }
}

