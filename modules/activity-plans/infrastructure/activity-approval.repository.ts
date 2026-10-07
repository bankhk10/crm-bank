import { db } from "@/lib/db";
import {
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
} from "@prisma/client";

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
    ActivityStatus.PENDING_BUDGET_APPROVAL,
    ActivityStatus.PENDING_HELPER_APPROVAL,
    ActivityStatus.PENDING_REVIEW,
  ];

  const fullPlanInclude = {
    employee: {
      include: {
        position: true,
        department: true,
      },
    },
    createdBy: {
      select: { id: true, name: true, email: true },
    },
    currentApprover: {
      include: {
        position: true,
        department: true,
      },
    },
    activityType: true,
    workTypes: {
      include: {
        activityType: true,
      },
    },
    stores: {
      include: {
        store: {
          select: {
            id: true,
            name: true,
            customerCode: true,
            customerType: true,
            province: true,
            district: true,
          },
        },
      },
    },
    products: {
      include: {
        product: {
          select: { id: true, name: true, productCode: true, price: true },
        },
        store: {
          select: { id: true, name: true, customerCode: true },
        },
      },
    },
    tour: {
      include: {
        store: {
          select: { id: true, name: true, customerCode: true, province: true },
        },
      },
    },
    marketingItems: {
      orderBy: { createdAt: "asc" as const },
    },
    promotionItems: {
      orderBy: { createdAt: "asc" as const },
    },
    type13: {
      include: {
        plots: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                customerCode: true,
                customerType: true,
                province: true,
                district: true,
              },
            },
            demoPlot: true,
          },
          orderBy: { plotIndex: "asc" as const },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                unit: true,
                packageSizeUnit: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" as const },
        },
      },
    },
    type14: {
      include: {
        sourceActivityPlan: {
          select: {
            id: true,
            code: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        plots: {
          include: {
            demoPlot: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                unit: true,
                packageSizeUnit: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" as const },
        },
      },
    },
    demoPlotVisits: {
      include: {
        demoPlot: true,
      },
    },
    helpers: {
      where: { deletedAt: null },
      include: {
        employee: {
          include: {
            position: true,
            department: true,
          },
        },
        approvedBy: true,
      },
    },
    approvalLogs: {
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" as const },
    },
    result: {
      include: {
        logs: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" as const },
        },
        saleResults: true,
        stockResults: true,
        surveyResults: true,
        demoResults: true,
        followupResults: true,
        sprayRounds: {
          include: {
            products: true,
            externalProducts: true,
            attachments: true,
          },
          orderBy: { roundNumber: "asc" as const },
        },
        attachments: true,
      },
    },
    attachments: true,
  };

  const [pendingPlans, historyPlans, activityTypes] = await Promise.all([
    db.activityPlan.findMany({
      where: {
        deletedAt: null,
        status: { in: pendingStatuses },
      },
      include: fullPlanInclude,
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
      include: fullPlanInclude,
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
