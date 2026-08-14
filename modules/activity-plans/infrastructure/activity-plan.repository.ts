import { db } from "@/lib/db";
import {
  Prisma,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
  ActivityResultStatus,
  DemoPlotStatus,
} from "@prisma/client";

export type ListActivityPlansParams = {
  page?: number;
  perPage?: number;
  q?: string;
  status?: ActivityStatus;
  employeeId?: string;
  currentApproverId?: string;
  activityTypeId?: string;
  fiscalYear?: number;
  fiscalMonth?: number;
  province?: string;
};

/**
 * Utility to compute fiscal dimensions & duration from dates
 */
export function computeFiscalFields(startDate: Date, endDate: Date) {
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1; // 1-12
  const quarter = Math.ceil(month / 3);   // 1-4
  const msPerDay = 1000 * 60 * 60 * 24;
  const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));

  return {
    fiscalYear: year,
    fiscalMonth: month,
    fiscalQuarter: quarter,
    durationDays,
  };
}

/**
 * Fetch all active activity types (lookup master)
 */
export async function findActivityTypes() {
  return db.activityType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Find activity type by code (e.g. "TYPE_1")
 */
export async function findActivityTypeByCode(code: string) {
  return db.activityType.findUnique({
    where: { code },
  });
}

/**
 * Resolve activity type ID (accepts either cuid ID or code like "TYPE_1")
 */
export async function resolveActivityTypeId(
  idOrCode: string,
  tx: Prisma.TransactionClient | typeof db = db
): Promise<string> {
  if (!idOrCode) {
    const first = await tx.activityType.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return first?.id ?? "";
  }

  // 1. Check by code (e.g. TYPE_1)
  const byCode = await tx.activityType.findUnique({
    where: { code: idOrCode },
  });
  if (byCode) return byCode.id;

  // 2. Check by id
  const byId = await tx.activityType.findUnique({
    where: { id: idOrCode },
  });
  if (byId) return byId.id;

  // 3. Fallback to first active activity type
  const first = await tx.activityType.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return first?.id ?? idOrCode;
}

/**
 * Find activity plan by ID with full relations
 */
export async function findActivityPlanById(id: string) {
  return db.activityPlan.findFirst({
    where: { id, deletedAt: null },
    include: {
      activityType: true,
      items: {
        orderBy: { itemOrder: "asc" },
      },
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
      result: {
        include: {
          recordedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
}

/**
 * Find activity plans with pagination & filtering
 */
export async function findActivityPlans(params: ListActivityPlansParams) {
  const {
    page = 1,
    perPage = 10,
    q,
    status,
    employeeId,
    currentApproverId,
    activityTypeId,
    fiscalYear,
    fiscalMonth,
    province,
  } = params;

  const where: Prisma.ActivityPlanWhereInput = { deletedAt: null };

  if (status) {
    where.status = status;
  }

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (currentApproverId) {
    where.currentApproverEmployeeId = currentApproverId;
  }

  if (activityTypeId) {
    where.activityTypeId = await resolveActivityTypeId(activityTypeId);
  }

  if (fiscalYear) {
    where.fiscalYear = fiscalYear;
  }

  if (fiscalMonth) {
    where.fiscalMonth = fiscalMonth;
  }

  if (province) {
    where.province = province;
  }

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { objective: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { province: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
      { employee: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, activityPlans] = await Promise.all([
    db.activityPlan.count({ where }),
    db.activityPlan.findMany({
      where,
      include: {
        activityType: true,
        items: true,
        result: true,
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
 * Helper to generate Activity Plan Code (format: TPYYMMXXXX)
 */
export async function generateActivityPlanCode(
  tx: Prisma.TransactionClient | typeof db,
  date: Date = new Date()
): Promise<string> {
  const yearStr = String(date.getFullYear()).slice(-2);
  const monthStr = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `TP${yearStr}${monthStr}`;

  const lastPlan = await tx.activityPlan.findFirst({
    where: {
      code: { startsWith: prefix },
    },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let seq = 1;
  if (lastPlan?.code && lastPlan.code.length >= prefix.length + 4) {
    const lastSeq = parseInt(lastPlan.code.slice(-4), 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  const seqStr = String(seq).padStart(4, "0");
  return `${prefix}${seqStr}`;
}

export type CreateActivityPlanInput = {
  code?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  activityTypeId: string;
  location: string;
  province?: string | null;
  district?: string | null;
  objective: string;
  description?: string | null;
  notes?: string | null;
  salesPromotionBudgetRequested?: number | null;
  marketingBudgetRequested?: number | null;
  status?: ActivityStatus;
  employeeId: string;
  createdById: string;
  currentApproverEmployeeId?: string | null;
  items?: Record<string, any>[];
  helperEmployeeIds?: string[];
};

/**
 * Create a new ActivityPlan inside a transaction
 */
export async function createActivityPlan(input: CreateActivityPlanInput) {
  return db.$transaction(async (tx) => {
    const code = input.code || (await generateActivityPlanCode(tx, input.startDate));
    const fiscal = computeFiscalFields(input.startDate, input.endDate);

    const spRequested = input.salesPromotionBudgetRequested ?? 0;
    const mktRequested = input.marketingBudgetRequested ?? 0;
    const totalRequested = spRequested + mktRequested;

    const resolvedActivityTypeId = await resolveActivityTypeId(input.activityTypeId, tx);

    // 1. Create main ActivityPlan
    const plan = await tx.activityPlan.create({
      data: {
        code,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        durationDays: fiscal.durationDays,
        fiscalYear: fiscal.fiscalYear,
        fiscalMonth: fiscal.fiscalMonth,
        fiscalQuarter: fiscal.fiscalQuarter,
        activityTypeId: resolvedActivityTypeId,
        location: input.location,
        province: input.province ?? null,
        district: input.district ?? null,
        objective: input.objective,
        description: input.description ?? null,
        notes: input.notes ?? null,
        salesPromotionBudgetRequested: input.salesPromotionBudgetRequested ? new Prisma.Decimal(input.salesPromotionBudgetRequested) : null,
        marketingBudgetRequested: input.marketingBudgetRequested ? new Prisma.Decimal(input.marketingBudgetRequested) : null,
        totalBudgetRequested: new Prisma.Decimal(totalRequested),
        status: input.status ?? ActivityStatus.DRAFT,
        employeeId: input.employeeId,
        createdById: input.createdById,
        currentApproverEmployeeId: input.currentApproverEmployeeId ?? null,
      },
    });

    // 2. Create Items (Wide Table)
    if (input.items && input.items.length > 0) {
      await tx.activityPlanItem.createMany({
        data: input.items.map((item, idx) => ({
          activityPlanId: plan.id,
          itemOrder: idx + 1,
          customerName: item.customerName ?? item.ownerName ?? item.storeName ?? null,
          detail: item.detail ?? null,
          visitTopic: item.visitTopic ?? item.topic ?? null,
          followupProductName: item.followupProductName ?? item.productName ?? null,
          saleProductName: item.saleProductName ?? item.productName ?? null,
          saleQuantity: item.saleQuantity ?? item.quantity ?? null,
          saleUnitPrice: item.saleUnitPrice != null ? new Prisma.Decimal(item.saleUnitPrice) : (item.unitPrice != null ? new Prisma.Decimal(item.unitPrice) : null),
          saleTotalPrice: item.saleTotalPrice != null ? new Prisma.Decimal(item.saleTotalPrice) : (item.price != null ? new Prisma.Decimal(item.price) : null),
          collectAmount: item.collectAmount != null ? new Prisma.Decimal(item.collectAmount) : null,
          surveyCompetitorProduct: item.surveyCompetitorProduct ?? item.comparedProduct ?? null,
          surveyStoreName: item.surveyStoreName ?? item.storeName ?? null,
          issueType: item.issueType ?? null,
          plotActivityType: item.plotActivityType ?? null,
          plotOwnerName: item.plotOwnerName ?? item.ownerName ?? null,
          plotProductName: item.plotProductName ?? item.productName ?? null,
          plotCropCategory: item.plotCropCategory ?? item.cropCategory ?? null,
          plotCropName: item.plotCropName ?? item.cropName ?? item.customCropName ?? null,
          plotAreaRai: item.plotAreaRai ? new Prisma.Decimal(item.plotAreaRai) : (item.areaRai ? new Prisma.Decimal(item.areaRai) : null),
          plotTreeCount: item.plotTreeCount ?? item.treeCount ?? null,
          plotCount:
            item.plotCount != null
              ? Number(item.plotCount)
              : item.plotsCount != null && item.plotsCount !== ""
                ? Number(item.plotsCount)
                : null,
          existingPlotId: item.existingPlotId ?? null,
          plotGrowthStage: item.plotGrowthStage ?? item.growthStage ?? null,
          plotStatus: item.plotStatus ?? null,
          meetingTopic: item.meetingTopic ?? item.topic ?? null,
          meetingAttendeesCount: item.meetingAttendeesCount ?? item.attendeesCount ?? null,
          meetingTargetProducts: item.meetingTargetProducts ? (Array.isArray(item.meetingTargetProducts) ? item.meetingTargetProducts.join(",") : String(item.meetingTargetProducts)) : null,
          storeProductName: item.storeProductName ?? item.productName ?? null,
          storeQuantityCases: item.storeQuantityCases ?? item.quantityCases ?? null,
          storePricePerCase: item.storePricePerCase ? new Prisma.Decimal(item.storePricePerCase) : (item.pricePerCase ? new Prisma.Decimal(item.pricePerCase) : null),
          storeTotalAmount: item.storeTotalAmount ? new Prisma.Decimal(item.storeTotalAmount) : null,
        })),
      });
    }

    // 3. Create Helpers
    if (input.helperEmployeeIds && input.helperEmployeeIds.length > 0) {
      const helperEmployees = await tx.employee.findMany({
        where: { id: { in: input.helperEmployeeIds } },
        include: { department: true },
      });

      await tx.activityHelper.createMany({
        data: input.helperEmployeeIds.map((empId) => {
          const emp = helperEmployees.find((e) => e.id === empId);
          return {
            activityPlanId: plan.id,
            employeeId: empId,
            departmentId: emp?.departmentId ?? null,
            departmentName: emp?.departmentName || emp?.department?.name || null,
            status: ActivityHelperStatus.PENDING,
          };
        }),
      });
    }

    // 4. Create initial approval log
    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: plan.id,
        userId: input.createdById,
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
  planData: Partial<CreateActivityPlanInput> & {
    helperEmployeeIds?: string[];
    updatedUserId: string;
  }
) {
  return db.$transaction(async (tx) => {
    const { helperEmployeeIds, updatedUserId, items, ...updateFields } = planData;

    // Build update dataset
    const dataToUpdate: Prisma.ActivityPlanUncheckedUpdateInput = {};

    if (updateFields.title !== undefined) dataToUpdate.title = updateFields.title;
    if (updateFields.activityTypeId !== undefined) {
      dataToUpdate.activityTypeId = await resolveActivityTypeId(updateFields.activityTypeId, tx);
    }
    if (updateFields.location !== undefined) dataToUpdate.location = updateFields.location;
    if (updateFields.province !== undefined) dataToUpdate.province = updateFields.province;
    if (updateFields.district !== undefined) dataToUpdate.district = updateFields.district;
    if (updateFields.objective !== undefined) dataToUpdate.objective = updateFields.objective;
    if (updateFields.description !== undefined) dataToUpdate.description = updateFields.description;
    if (updateFields.notes !== undefined) dataToUpdate.notes = updateFields.notes;
    if (updateFields.status !== undefined) dataToUpdate.status = updateFields.status;

    if (updateFields.startDate || updateFields.endDate) {
      const existing = await tx.activityPlan.findUnique({ where: { id } });
      const startDate = updateFields.startDate || existing?.startDate || new Date();
      const endDate = updateFields.endDate || existing?.endDate || new Date();

      const fiscal = computeFiscalFields(startDate, endDate);
      dataToUpdate.startDate = startDate;
      dataToUpdate.endDate = endDate;
      dataToUpdate.durationDays = fiscal.durationDays;
      dataToUpdate.fiscalYear = fiscal.fiscalYear;
      dataToUpdate.fiscalMonth = fiscal.fiscalMonth;
      dataToUpdate.fiscalQuarter = fiscal.fiscalQuarter;
    }

    if (updateFields.salesPromotionBudgetRequested !== undefined || updateFields.marketingBudgetRequested !== undefined) {
      const existing = await tx.activityPlan.findUnique({ where: { id } });
      const sp = updateFields.salesPromotionBudgetRequested !== undefined
        ? updateFields.salesPromotionBudgetRequested
        : (existing?.salesPromotionBudgetRequested ? Number(existing.salesPromotionBudgetRequested) : 0);
      const mkt = updateFields.marketingBudgetRequested !== undefined
        ? updateFields.marketingBudgetRequested
        : (existing?.marketingBudgetRequested ? Number(existing.marketingBudgetRequested) : 0);

      dataToUpdate.salesPromotionBudgetRequested = sp ? new Prisma.Decimal(sp) : null;
      dataToUpdate.marketingBudgetRequested = mkt ? new Prisma.Decimal(mkt) : null;
      dataToUpdate.totalBudgetRequested = new Prisma.Decimal((sp || 0) + (mkt || 0));
    }

    // 1. Update main record
    const updatedPlan = await tx.activityPlan.update({
      where: { id },
      data: dataToUpdate,
    });

    // 2. Sync Items if provided
    if (items !== undefined) {
      await tx.activityPlanItem.deleteMany({ where: { activityPlanId: id } });

      if (items.length > 0) {
        await tx.activityPlanItem.createMany({
          data: items.map((item, idx) => ({
            activityPlanId: id,
            itemOrder: idx + 1,
            customerName: item.customerName ?? item.ownerName ?? item.storeName ?? null,
            detail: item.detail ?? null,
            visitTopic: item.visitTopic ?? item.topic ?? null,
            followupProductName: item.followupProductName ?? item.productName ?? null,
            saleProductName: item.saleProductName ?? item.productName ?? null,
            saleQuantity: item.saleQuantity ?? item.quantity ?? null,
            saleUnitPrice: item.saleUnitPrice != null ? new Prisma.Decimal(item.saleUnitPrice) : (item.unitPrice != null ? new Prisma.Decimal(item.unitPrice) : null),
            saleTotalPrice: item.saleTotalPrice != null ? new Prisma.Decimal(item.saleTotalPrice) : (item.price != null ? new Prisma.Decimal(item.price) : null),
            collectAmount: item.collectAmount != null ? new Prisma.Decimal(item.collectAmount) : null,
            surveyCompetitorProduct: item.surveyCompetitorProduct ?? item.comparedProduct ?? null,
            surveyStoreName: item.surveyStoreName ?? item.storeName ?? null,
            issueType: item.issueType ?? null,
            plotActivityType: item.plotActivityType ?? null,
            plotOwnerName: item.plotOwnerName ?? item.ownerName ?? null,
            plotProductName: item.plotProductName ?? item.productName ?? null,
            plotCropCategory: item.plotCropCategory ?? item.cropCategory ?? null,
            plotCropName: item.plotCropName ?? item.cropName ?? item.customCropName ?? null,
            plotAreaRai: item.plotAreaRai ? new Prisma.Decimal(item.plotAreaRai) : (item.areaRai ? new Prisma.Decimal(item.areaRai) : null),
            plotTreeCount: item.plotTreeCount ?? item.treeCount ?? null,
            plotCount:
              item.plotCount != null
                ? Number(item.plotCount)
                : item.plotsCount != null && item.plotsCount !== ""
                  ? Number(item.plotsCount)
                  : null,
            existingPlotId: item.existingPlotId ?? null,
            plotGrowthStage: item.plotGrowthStage ?? item.growthStage ?? null,
            plotStatus: item.plotStatus ?? null,
            meetingTopic: item.meetingTopic ?? item.topic ?? null,
            meetingAttendeesCount: item.meetingAttendeesCount ?? item.attendeesCount ?? null,
            meetingTargetProducts: item.meetingTargetProducts ? (Array.isArray(item.meetingTargetProducts) ? item.meetingTargetProducts.join(",") : String(item.meetingTargetProducts)) : null,
            storeProductName: item.storeProductName ?? item.productName ?? null,
            storeQuantityCases: item.storeQuantityCases ?? item.quantityCases ?? null,
            storePricePerCase: item.storePricePerCase ? new Prisma.Decimal(item.storePricePerCase) : (item.pricePerCase ? new Prisma.Decimal(item.pricePerCase) : null),
            storeTotalAmount: item.storeTotalAmount ? new Prisma.Decimal(item.storeTotalAmount) : null,
          })),
        });
      }
    }

    // 3. Sync Helpers if provided
    if (helperEmployeeIds !== undefined) {
      const existingHelpers = await tx.activityHelper.findMany({
        where: { activityPlanId: id },
      });

      const toRemove = existingHelpers.filter(
        (h) => !helperEmployeeIds.includes(h.employeeId) && h.deletedAt === null
      );
      if (toRemove.length > 0) {
        await tx.activityHelper.updateMany({
          where: { id: { in: toRemove.map((h) => h.id) } },
          data: { deletedAt: new Date() },
        });
      }

      for (const empId of helperEmployeeIds) {
        const match = existingHelpers.find((h) => h.employeeId === empId);
        if (!match) {
          const emp = await tx.employee.findUnique({
            where: { id: empId },
            include: { department: true },
          });
          await tx.activityHelper.create({
            data: {
              activityPlanId: id,
              employeeId: empId,
              departmentId: emp?.departmentId ?? null,
              departmentName: emp?.departmentName || emp?.department?.name || null,
              status: ActivityHelperStatus.PENDING,
            },
          });
        } else if (match.deletedAt !== null) {
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
 * Retrieve or auto-create employee profile for logged-in user
 */
export async function findOrCreateEmployeeForUser(userId: string, userName?: string, userEmail?: string) {
  let employee = await db.employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      position: true,
      department: true,
    },
  });

  if (employee) return employee;

  if (userEmail) {
    employee = await db.employee.findFirst({
      where: { email: userEmail, deletedAt: null },
      include: {
        position: true,
        department: true,
      },
    });

    if (employee) {
      if (!employee.userId) {
        await db.employee.update({
          where: { id: employee.id },
          data: { userId },
        });
      }
      return employee;
    }
  }

  const name = userName || "พนักงาน";
  const email = userEmail || `user-${userId}@crm.local`;

  const existingEmail = await db.employee.findFirst({ where: { email } });
  const finalEmail = existingEmail ? `emp-${userId.slice(-6)}@crm.local` : email;

  return db.employee.create({
    data: {
      name,
      email: finalEmail,
      userId,
    },
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

export type CreateActivityResultInput = {
  activityPlanId: string;
  actualStartDate: Date;
  actualEndDate: Date;
  actualAttendeesCount?: number | null;
  resultStatus?: ActivityResultStatus;
  resultSummary?: string | null;
  problemFound?: string | null;
  nextAction?: string | null;
  cancelReason?: string | null;
  postponedDate?: Date | null;
  postponedTime?: string | null;
  postponedReason?: string | null;
  postponedNotes?: string | null;
  actualSalesPromotionSpent?: number | null;
  actualMarketingSpent?: number | null;
  salesResultAmount?: number | null;
  salesOrdersCount?: number | null;
  collectResultAmount?: number | null;
  demoPlotsCreated?: number | null;
  demoPlotsFollowedUp?: number | null;
  distributorsCount?: number | null;
  farmersCount?: number | null;
  recordedById: string;
};

/**
 * Create or update ActivityResult (Post-activity outcome recording)
 */
export async function upsertActivityResult(input: CreateActivityResultInput) {
  const spSpent = input.actualSalesPromotionSpent ?? 0;
  const mktSpent = input.actualMarketingSpent ?? 0;
  const actualTotalSpent = spSpent + mktSpent;

  return db.activityResult.upsert({
    where: { activityPlanId: input.activityPlanId },
    create: {
      activityPlanId: input.activityPlanId,
      actualStartDate: input.actualStartDate,
      actualEndDate: input.actualEndDate,
      actualAttendeesCount: input.actualAttendeesCount ?? null,
      resultStatus: input.resultStatus ?? ActivityResultStatus.PARTIAL,
      resultSummary: input.resultSummary ?? null,
      problemFound: input.problemFound ?? null,
      nextAction: input.nextAction ?? null,
      cancelReason: input.cancelReason ?? null,
      postponedDate: input.postponedDate ?? null,
      postponedTime: input.postponedTime ?? null,
      postponedReason: input.postponedReason ?? null,
      postponedNotes: input.postponedNotes ?? null,
      actualSalesPromotionSpent: input.actualSalesPromotionSpent ? new Prisma.Decimal(input.actualSalesPromotionSpent) : null,
      actualMarketingSpent: input.actualMarketingSpent ? new Prisma.Decimal(input.actualMarketingSpent) : null,
      actualTotalSpent: new Prisma.Decimal(actualTotalSpent),
      salesResultAmount: input.salesResultAmount ? new Prisma.Decimal(input.salesResultAmount) : null,
      salesOrdersCount: input.salesOrdersCount ?? null,
      collectResultAmount: input.collectResultAmount ? new Prisma.Decimal(input.collectResultAmount) : null,
      demoPlotsCreated: input.demoPlotsCreated ?? null,
      demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
      distributorsCount: input.distributorsCount ?? null,
      farmersCount: input.farmersCount ?? null,
      recordedById: input.recordedById,
    },
    update: {
      actualStartDate: input.actualStartDate,
      actualEndDate: input.actualEndDate,
      actualAttendeesCount: input.actualAttendeesCount ?? null,
      resultStatus: input.resultStatus ?? ActivityResultStatus.PARTIAL,
      resultSummary: input.resultSummary ?? null,
      problemFound: input.problemFound ?? null,
      nextAction: input.nextAction ?? null,
      cancelReason: input.cancelReason ?? null,
      postponedDate: input.postponedDate ?? null,
      postponedTime: input.postponedTime ?? null,
      postponedReason: input.postponedReason ?? null,
      postponedNotes: input.postponedNotes ?? null,
      actualSalesPromotionSpent: input.actualSalesPromotionSpent ? new Prisma.Decimal(input.actualSalesPromotionSpent) : null,
      actualMarketingSpent: input.actualMarketingSpent ? new Prisma.Decimal(input.actualMarketingSpent) : null,
      actualTotalSpent: new Prisma.Decimal(actualTotalSpent),
      salesResultAmount: input.salesResultAmount ? new Prisma.Decimal(input.salesResultAmount) : null,
      salesOrdersCount: input.salesOrdersCount ?? null,
      collectResultAmount: input.collectResultAmount ? new Prisma.Decimal(input.collectResultAmount) : null,
      demoPlotsCreated: input.demoPlotsCreated ?? null,
      demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
      distributorsCount: input.distributorsCount ?? null,
      farmersCount: input.farmersCount ?? null,
      recordedById: input.recordedById,
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
  ];

  const fullPlanInclude = {
    activityType: true,
    items: {
      orderBy: { itemOrder: "asc" as const },
    },
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
      orderBy: { createdAt: "desc" as const },
    },
    result: true,
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

/**
 * ─────────────────────────────────────────────────────────────
 * DEMO PLOT (WORK TYPE 7) REPOSITORY METHODS
 * ─────────────────────────────────────────────────────────────
 */

export async function listAvailableDemoPlots(status?: DemoPlotStatus) {
  const plots = await db.demoPlot.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
    },
    include: {
      visits: {
        orderBy: { visitDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return plots.map((plot) => {
    const visitsCount = plot.visits.length;
    const totalCost = plot.visits.reduce(
      (sum, v) => sum + (Number(v.totalVisitCost) || 0),
      0,
    );
    const lastVisit = plot.visits[plot.visits.length - 1];
    const msPerDay = 1000 * 60 * 60 * 24;
    const latestDate = lastVisit ? new Date(lastVisit.visitDate) : new Date();
    const daysSinceStart = Math.max(
      0,
      Math.floor(
        (latestDate.getTime() - new Date(plot.startDate).getTime()) / msPerDay,
      ),
    );

    return {
      ...plot,
      visitsCount,
      totalCost,
      daysSinceStart,
      lastVisit: lastVisit || null,
    };
  });
}

export async function getDemoPlotWithHistory(demoPlotId: string) {
  return db.demoPlot.findUnique({
    where: { id: demoPlotId },
    include: {
      visits: {
        orderBy: { visitDate: "asc" },
        include: {
          activityPlan: {
            select: {
              id: true,
              code: true,
              title: true,
              startDate: true,
            },
          },
        },
      },
    },
  });
}

export async function createDemoPlotRecord(data: {
  code?: string;
  name: string;
  ownerName: string;
  customerId?: string | null;
  employeeId: string;
  cropCategory: string;
  cropName: string;
  customCropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  location?: string | null;
  province?: string | null;
  district?: string | null;
  primaryProductId?: string | null;
  primaryProductName: string;
  objective?: string | null;
  experimentDetail?: string | null;
  startDate: Date;
}) {
  let code = data.code;
  if (!code) {
    const d = new Date(data.startDate);
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const count = await db.demoPlot.count();
    code = `DP${year}${month}${String(count + 1).padStart(4, "0")}`;
  }

  return db.demoPlot.create({
    data: {
      code,
      name: data.name,
      ownerName: data.ownerName,
      customerId: data.customerId ?? null,
      employeeId: data.employeeId,
      cropCategory: data.cropCategory,
      cropName: data.cropName,
      customCropName: data.customCropName ?? null,
      areaRai: data.areaRai ? new Prisma.Decimal(data.areaRai) : null,
      treeCount: data.treeCount ?? null,
      location: data.location ?? null,
      province: data.province ?? null,
      district: data.district ?? null,
      primaryProductId: data.primaryProductId ?? null,
      primaryProductName: data.primaryProductName,
      objective: data.objective ?? null,
      experimentDetail: data.experimentDetail ?? null,
      startDate: data.startDate,
      status: DemoPlotStatus.IN_PROGRESS,
    },
  });
}

export async function recordDemoPlotVisit(data: {
  demoPlotId: string;
  activityPlanId?: string | null;
  visitDate: Date;
  cropAgeValue?: number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  cropProblemDesc?: string | null;
  productResponse?: string | null;
  productProblemDesc?: string | null;
  usageMethod?: string | null;
  productUsedQty?: number | null;
  productUnitPrice?: number | null;
  otherExpenses?: number | null;
  imageUrls?: string[];
  notes?: string | null;
  plotStatus?: DemoPlotStatus;
  finalYieldKg?: number | null;
  controlYieldKg?: number | null;
  yieldIncreasePercent?: number | null;
  farmerSatisfaction?: number | null;
  commercialPotential?: string | null;
  finalSummaryNotes?: string | null;
}) {
  const plot = await db.demoPlot.findUnique({
    where: { id: data.demoPlotId },
    include: { visits: true },
  });

  if (!plot) {
    throw new Error(`DemoPlot not found: ${data.demoPlotId}`);
  }

  const visitNumber = plot.visits.length + 1;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceStart = Math.max(
    0,
    Math.floor(
      (data.visitDate.getTime() - new Date(plot.startDate).getTime()) / msPerDay,
    ),
  );

  const productUsedQty = data.productUsedQty || 0;
  const productUnitPrice = data.productUnitPrice || 0;
  const productCost = productUsedQty * productUnitPrice;
  const otherExpenses = data.otherExpenses || 0;
  const totalVisitCost = productCost + otherExpenses;

  return db.$transaction(async (tx) => {
    const visit = await tx.demoPlotVisit.create({
      data: {
        demoPlotId: data.demoPlotId,
        activityPlanId: data.activityPlanId ?? null,
        visitNumber,
        visitDate: data.visitDate,
        daysSinceStart,
        cropAgeValue: data.cropAgeValue ?? null,
        cropAgeUnit: data.cropAgeUnit ?? null,
        growthStage: data.growthStage ?? null,
        cropCondition: data.cropCondition ?? null,
        cropProblemDesc: data.cropProblemDesc ?? null,
        productResponse: data.productResponse ?? null,
        productProblemDesc: data.productProblemDesc ?? null,
        usageMethod: data.usageMethod ?? null,
        productUsedQty,
        productUnitPrice: new Prisma.Decimal(productUnitPrice),
        productCost: new Prisma.Decimal(productCost),
        otherExpenses: new Prisma.Decimal(otherExpenses),
        totalVisitCost: new Prisma.Decimal(totalVisitCost),
        imageUrls: data.imageUrls || [],
        notes: data.notes ?? null,
      },
    });

    if (data.plotStatus && data.plotStatus !== plot.status) {
      await tx.demoPlot.update({
        where: { id: data.demoPlotId },
        data: {
          status: data.plotStatus,
          closedDate:
            data.plotStatus === DemoPlotStatus.COMPLETED ||
            data.plotStatus === DemoPlotStatus.FAILED
              ? data.visitDate
              : null,
          demoYieldKg: data.finalYieldKg
            ? new Prisma.Decimal(data.finalYieldKg)
            : undefined,
          controlYieldKg: data.controlYieldKg
            ? new Prisma.Decimal(data.controlYieldKg)
            : undefined,
          yieldIncreasePercent: data.yieldIncreasePercent
            ? new Prisma.Decimal(data.yieldIncreasePercent)
            : undefined,
          farmerSatisfaction: data.farmerSatisfaction ?? undefined,
          commercialPotential: data.commercialPotential ?? undefined,
          finalSummaryNotes: data.finalSummaryNotes ?? undefined,
        },
      });
    }

    return visit;
  });
}

