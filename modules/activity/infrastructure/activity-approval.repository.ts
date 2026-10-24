import { db } from "@/lib/db";
import {
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
} from "@prisma/client";
import { ACTIVITY_PLAN_FULL_INCLUDE } from "./activity-plan-include";

/**
 * Create an approval log entry with step duration tracking
 */
export async function createApprovalLog(data: {
  activityPlanId: string;
  userId: string;
  action: ActivityApprovalAction;
  step: ActivityApprovalStep;
  fromStatus?: ActivityStatus;
  toStatus?: ActivityStatus;
  comment?: string;
}) {
  // Find last log to compute stepDurationSeconds
  const lastLog = await db.activityApprovalLog.findFirst({
    where: { activityPlanId: data.activityPlanId },
    orderBy: { createdAt: "desc" },
  });

  let stepDurationSeconds: number | null = null;
  if (lastLog) {
    const durationMs = Date.now() - lastLog.createdAt.getTime();
    stepDurationSeconds = Math.max(0, Math.floor(durationMs / 1000));
  }

  return db.activityApprovalLog.create({
    data: {
      ...data,
      stepDurationSeconds,
    },
  });
}

/**
 * Update helper approval status
 */
export async function updateHelperStatus(
  activityPlanId: string,
  helperEmployeeId: string,
  status: ActivityHelperStatus,
  approvedById?: string,
  rejectionReason?: string,
) {
  return db.activityHelper.update({
    where: {
      activityPlanId_employeeId: {
        activityPlanId,
        employeeId: helperEmployeeId,
      },
    },
    data: {
      status,
      approvedById,
      rejectionReason,
      approvedAt: status === ActivityHelperStatus.APPROVED ? new Date() : null,
      respondedAt: new Date(),
    },
  });
}

/**
 * Retrieve helper info
 */
export async function findHelper(activityPlanId: string, employeeId: string) {
  return db.activityHelper.findUnique({
    where: {
      activityPlanId_employeeId: {
        activityPlanId,
        employeeId,
      },
    },
    include: {
      employee: {
        include: {
          department: true,
          position: true,
        },
      },
    },
  });
}

/**
 * Find all plans currently in approval queues and recent approval history
 */
export async function findApprovalQueueData() {
  const pendingStatuses: ActivityStatus[] = [
    ActivityStatus.PENDING_LINE_APPROVAL,
    ActivityStatus.PENDING_MARKETING_APPROVAL,
    ActivityStatus.PENDING_BUDGET_APPROVAL,
    ActivityStatus.PENDING_HELPER_APPROVAL,
    ActivityStatus.PENDING_CANCELLATION,
    ActivityStatus.PENDING_REVIEW,
  ];

  const [pendingPlans, historyPlans, activityTypes] = await Promise.all([
    db.activityPlan.findMany({
      where: {
        deletedAt: null,
        status: { in: pendingStatuses },
      },
      include: ACTIVITY_PLAN_FULL_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    db.activityPlan.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [
            ActivityStatus.APPROVED,
            ActivityStatus.REJECTED,
            ActivityStatus.WAITING_FOR_CORRECTION,
            ActivityStatus.REVIEWED,
            ActivityStatus.RETURNED,
          ],
        },
      },
      include: ACTIVITY_PLAN_FULL_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    db.activityType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    pendingPlans,
    historyPlans,
    activityTypes,
  };
}
