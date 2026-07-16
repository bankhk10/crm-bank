import { db } from "@/lib/db";
import { Prisma, ActivityStatus, ActivityHelperStatus, ActivityApprovalAction, ActivityApprovalStep } from "@prisma/client";

export type ListActivityPlansParams = {
  page?: number;
  perPage?: number;
  q?: string;
  status?: ActivityStatus;
  employeeId?: string;
  currentApproverId?: string;
};

/**
 * find activity plan by ID
 */
export async function findActivityPlanById(id: string) {
  return db.activityPlan.findFirst({
    where: { id, deletedAt: null },
    include: {
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
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Find activity plans with pagination & filtering
 */
export async function findActivityPlans(params: ListActivityPlansParams) {
  const { page = 1, perPage = 10, q, status, employeeId, currentApproverId } = params;

  const where: Prisma.ActivityPlanWhereInput = { deletedAt: null };

  if (status) {
    where.status = status;
  }

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (currentApproverId) {
    where.currentApproverId = currentApproverId;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { objective: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { employee: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, activityPlans] = await Promise.all([
    db.activityPlan.count({ where }),
    db.activityPlan.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, positionTitle: true, departmentName: true },
        },
        currentApprover: {
          select: { id: true, name: true, positionTitle: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { total, activityPlans };
}

/**
 * Create a new ActivityPlan inside a transaction
 */
export async function createActivityPlan(
  planData: Prisma.ActivityPlanUncheckedCreateInput,
  helperEmployeeIds: string[]
) {
  return db.$transaction(async (tx) => {
    // 1. Create the main ActivityPlan
    const plan = await tx.activityPlan.create({
      data: {
        title: planData.title,
        startDate: planData.startDate,
        endDate: planData.endDate,
        activityType: planData.activityType,
        location: planData.location,
        objective: planData.objective,
        description: planData.description,
        salesPromotionBudget: planData.salesPromotionBudget,
        marketingBudget: planData.marketingBudget,
        notes: planData.notes,
        status: planData.status ?? ActivityStatus.DRAFT,
        employeeId: planData.employeeId,
        createdById: planData.createdById,
        currentApproverId: planData.currentApproverId,
      },
    });

    // 2. Create helpers if any
    if (helperEmployeeIds && helperEmployeeIds.length > 0) {
      await tx.activityHelper.createMany({
        data: helperEmployeeIds.map((empId) => ({
          activityPlanId: plan.id,
          employeeId: empId,
          status: ActivityHelperStatus.PENDING,
        })),
      });
    }

    // 3. Create initial approval log
    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: plan.id,
        userId: planData.createdById,
        action: ActivityApprovalAction.SUBMIT,
        step: ActivityApprovalStep.LINE_APPROVAL,
        comment: "บันทึกแผนงานร่างแรก",
      },
    });

    return plan;
  });
}

/**
 * Update an existing ActivityPlan inside a transaction
 */
export async function updateActivityPlan(
  id: string,
  planData: Partial<Prisma.ActivityPlanUncheckedUpdateInput> & {
    helperEmployeeIds?: string[];
    updatedUserId: string;
  }
) {
  return db.$transaction(async (tx) => {
    const { helperEmployeeIds, updatedUserId, ...updateFields } = planData;

    // 1. Update the main ActivityPlan fields
    const updatedPlan = await tx.activityPlan.update({
      where: { id },
      data: updateFields,
    });

    // 2. Sync helpers if provided
    if (helperEmployeeIds !== undefined) {
      const existingHelpers = await tx.activityHelper.findMany({
        where: { activityPlanId: id },
      });

      const existingEmpIds = existingHelpers.map((h) => h.employeeId);

      // Helpers to remove (soft delete)
      const toRemove = existingHelpers.filter(
        (h) => !helperEmployeeIds.includes(h.employeeId) && h.deletedAt === null
      );
      if (toRemove.length > 0) {
        await tx.activityHelper.updateMany({
          where: {
            id: { in: toRemove.map((h) => h.id) },
          },
          data: {
            deletedAt: new Date(),
          },
        });
      }

      // Helpers to add or restore
      for (const empId of helperEmployeeIds) {
        const match = existingHelpers.find((h) => h.employeeId === empId);
        if (!match) {
          // Add new
          await tx.activityHelper.create({
            data: {
              activityPlanId: id,
              employeeId: empId,
              status: ActivityHelperStatus.PENDING,
            },
          });
        } else if (match.deletedAt !== null) {
          // Restore soft-deleted
          await tx.activityHelper.update({
            where: { id: match.id },
            data: {
              deletedAt: null,
              status: ActivityHelperStatus.PENDING,
              rejectionReason: null,
              approvedById: null,
              approvedAt: null,
            },
          });
        }
      }
    }

    return updatedPlan;
  });
}

/**
 * Soft delete activity plan and its helpers
 */
export async function softDeleteActivityPlan(id: string) {
  return db.$transaction(async (tx) => {
    const now = new Date();
    await tx.activityPlan.update({
      where: { id },
      data: { deletedAt: now },
    });
    await tx.activityHelper.updateMany({
      where: { activityPlanId: id, deletedAt: null },
      data: { deletedAt: now },
    });
  });
}

/**
 * Create an approval log entry
 */
export async function createApprovalLog(data: {
  activityPlanId: string;
  userId: string;
  action: ActivityApprovalAction;
  step: ActivityApprovalStep;
  comment?: string;
}) {
  return db.activityApprovalLog.create({
    data,
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
  rejectionReason?: string
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
 * Retrieve employee profile by user ID
 */
export async function findEmployeeByUserId(userId: string) {
  return db.employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      position: true,
      department: true,
    },
  });
}

/**
 * Retrieve employee profile by employee ID
 */
export async function findEmployeeById(id: string) {
  return db.employee.findUnique({
    where: { id, deletedAt: null },
    include: {
      position: true,
      department: true,
    },
  });
}
