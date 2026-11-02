import { db } from "@/lib/db";
import {
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
  Prisma,
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

export interface ApprovalQueueFilterOptions {
  isGlobalApprover?: boolean;
  userId?: string;
  employeeId?: string | null;
  subordinateEmployeeIds?: string[];
}

/**
 * Find plans currently in approval queues and recent approval history.
 * When options.isGlobalApprover is false, limits plans to:
 * - Plans the user has acted upon in approvalLogs
 * - Plans of subordinates in their hierarchy
 * - Plans where user is current approver, creator, or assigned helper
 */
export async function findApprovalQueueData(options?: ApprovalQueueFilterOptions) {
  const pendingStatuses: ActivityStatus[] = [
    ActivityStatus.PENDING_LINE_APPROVAL,
    ActivityStatus.PENDING_MARKETING_APPROVAL,
    ActivityStatus.PENDING_BUDGET_APPROVAL,
    ActivityStatus.PENDING_HELPER_APPROVAL,
    ActivityStatus.PENDING_CANCELLATION,
    ActivityStatus.PENDING_REVIEW,
  ];

  const isGlobal = options?.isGlobalApprover ?? true;
  const userId = options?.userId;
  const employeeId = options?.employeeId;
  const subordinateEmployeeIds = options?.subordinateEmployeeIds ?? [];

  let pendingWhere: Prisma.ActivityPlanWhereInput = {
    deletedAt: null,
    status: { in: pendingStatuses },
  };

  let historyWhere: Prisma.ActivityPlanWhereInput = {
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
  };

  // Fine-grained line-hierarchy & participation scoping for non-global approvers
  if (!isGlobal && userId) {
    const historyOrConditions: Prisma.ActivityPlanWhereInput[] = [
      { approvalLogs: { some: { userId } } },
      ...(subordinateEmployeeIds.length > 0
        ? [{ employeeId: { in: subordinateEmployeeIds } }]
        : []),
      ...(employeeId ? [{ employeeId }] : []),
      { createdById: userId },
      ...(employeeId
        ? [{ helpers: { some: { employeeId, deletedAt: null } } }]
        : []),
    ];

    historyWhere = {
      ...historyWhere,
      OR: historyOrConditions,
    };

    const pendingOrConditions: Prisma.ActivityPlanWhereInput[] = [
      ...(employeeId ? [{ currentApproverEmployeeId: employeeId }] : []),
      ...(subordinateEmployeeIds.length > 0
        ? [{ employeeId: { in: subordinateEmployeeIds } }]
        : []),
      ...(employeeId ? [{ employeeId }] : []),
      { createdById: userId },
      ...(employeeId
        ? [{ helpers: { some: { employeeId, deletedAt: null } } }]
        : []),
    ];

    pendingWhere = {
      ...pendingWhere,
      OR: pendingOrConditions,
    };
  }

  const [pendingPlans, historyPlans, activityTypes] = await Promise.all([
    db.activityPlan.findMany({
      where: pendingWhere,
      include: ACTIVITY_PLAN_FULL_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    db.activityPlan.findMany({
      where: historyWhere,
      include: ACTIVITY_PLAN_FULL_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: isGlobal ? 50 : 100,
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
