import { db } from "@/lib/db";
import {
  Prisma,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
  ActivityResultStatus,
  DemoPlotStatus,
  TourType,
  TourSize,
  AttachmentCategory,
} from "@prisma/client";
import { WORK_TYPE_CONFIG, getWorkTypeCode } from "../constants";

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

import { computeFiscalFields } from "../application/validations";
export { computeFiscalFields };

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
 * Resolve activity type ID (accepts either cuid ID, code like "TYPE_1", or Thai name like "ทัวร์")
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

  // 1. Direct ID check
  const byId = await tx.activityType.findUnique({
    where: { id: idOrCode },
  });
  if (byId) return byId.id;

  // 2. Resolve code via WORK_TYPE_CONFIG or raw string
  const resolvedCode = getWorkTypeCode(idOrCode);
  const byCode = await tx.activityType.findUnique({
    where: { code: resolvedCode },
  });
  if (byCode) return byCode.id;

  // 3. Check by name
  const byName = await tx.activityType.findFirst({
    where: { name: idOrCode },
  });
  if (byName) return byName.id;

  // 4. Auto-create if known in WORK_TYPE_CONFIG
  const config = WORK_TYPE_CONFIG[resolvedCode];
  if (config) {
    const created = await tx.activityType.upsert({
      where: { code: config.code },
      update: {
        name: config.name,
        shortName: config.shortName,
        sortOrder: config.sortOrder,
        hasActual: config.hasActual,
        requiresApproval: config.requiresApproval,
        isActive: true,
      },
      create: {
        code: config.code,
        name: config.name,
        shortName: config.shortName,
        sortOrder: config.sortOrder,
        hasActual: config.hasActual,
        requiresApproval: config.requiresApproval,
        isActive: true,
      },
    });
    return created.id;
  }

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
      workTypes: {
        include: {
          activityType: true,
        },
      },
      stores: {
        include: {
          store: {
            select: { id: true, name: true, customerCode: true, customerType: true, province: true, district: true },
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
        orderBy: { createdAt: "asc" },
      },
      promotionItems: {
        orderBy: { createdAt: "asc" },
      },
      demoPlotVisits: {
        include: {
          demoPlot: true,
        },
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
          saleResults: {
            include: {
              product: {
                select: { id: true, name: true, productCode: true },
              },
              store: {
                select: { id: true, name: true, customerCode: true },
              },
            },
          },
          stockResults: {
            include: {
              product: {
                select: { id: true, name: true, productCode: true },
              },
              store: {
                select: { id: true, name: true, customerCode: true },
              },
            },
          },
          surveyResults: {
            include: {
              product: {
                select: { id: true, name: true, productCode: true },
              },
              store: {
                select: { id: true, name: true, customerCode: true },
              },
            },
          },
          demoResults: {
            include: {
              plannedProduct: {
                select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
              },
              actualProduct: {
                select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
              },
            },
          },
          followupResults: {
            include: {
              product: {
                select: { id: true, name: true, productCode: true },
              },
              store: {
                select: { id: true, name: true, customerCode: true },
              },
            },
          },
          attachments: true,
        },
      },
      attachments: true,
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
    if (["COMPLETED", "PARTIAL", "POSTPONED"].includes(status)) {
      where.result = { resultStatus: status as any };
    } else if (status === "CANCELLED") {
      where.OR = [
        { status: "CANCELLED" },
        { result: { resultStatus: "CANCELLED" } },
      ];
    } else {
      where.status = status;
    }
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
        workTypes: {
          include: {
            activityType: true,
          },
        },
        tour: true,
        stores: {
          include: {
            store: {
              select: { id: true, name: true, customerCode: true },
            },
          },
        },
        products: {
          include: {
            product: {
              select: { id: true, name: true, productCode: true },
            },
          },
        },
        marketingItems: true,
        promotionItems: true,
        result: true,
        employee: {
          select: { id: true, name: true, positionTitle: true, departmentName: true },
        },
        currentApprover: {
          select: { id: true, name: true, positionTitle: true },
        },
        helpers: {
          where: { deletedAt: null },
          select: {
            status: true,
            employee: {
              select: {
                department: { select: { code: true } },
                departmentName: true,
                positionTitle: true,
              },
            },
          },
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
 * Uses strict regex parsing, transaction advisory lock, and collision protection.
 */
export async function generateActivityPlanCode(
  tx: Prisma.TransactionClient | typeof db,
  date: Date = new Date()
): Promise<string> {
  const yearStr = String(date.getFullYear()).slice(-2);
  const monthStr = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `TP${yearStr}${monthStr}`;

  // 1. Transaction-level advisory lock to serialize concurrent code generation for the same monthly prefix
  try {
    await (tx as any).$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;
  } catch {
    // If not supported or outside transaction, proceed with regex-based scan
  }

  // 2. Fetch all existing plans matching the prefix
  const existingPlans = await tx.activityPlan.findMany({
    where: {
      code: { startsWith: prefix },
    },
    select: { code: true },
  });

  // 3. Extract max numeric sequence strictly matching TPYYMM\d{4}
  let maxSeq = 0;
  const codeRegex = new RegExp(`^${prefix}(\\d{4})$`);

  for (const p of existingPlans) {
    if (p.code) {
      const match = p.code.match(codeRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, "0");
  return `${prefix}${seqStr}`;
}

export type CreateActivityPlanInput = {
  code?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  activityTypeId?: string;
  workTypeCodes?: string[];
  location?: string | null;
  province?: string | null;
  district?: string | null;
  objective: string;
  description?: string | null;
  notes?: string | null;
  targetAttendeesCount?: number | null;
  targetBookingSales?: number | null;
  demoPlotId?: string | null;
  salesPromotionBudgetRequested?: number | null;
  marketingBudgetRequested?: number | null;
  totalBudgetRequested?: number | null;
  status?: ActivityStatus;
  employeeId: string;
  createdById: string;
  currentApproverEmployeeId?: string | null;
  helperEmployeeIds?: string[];
  tourData?: {
    tourType: "CENTRAL" | "STORE";
    tourSize?: "SMALL" | "LARGE" | null;
    country?: string | null;
    storeId?: string | null;
    destination?: string | null;
  } | null;
  planStores?: Array<{
    workTypeCode: string;
    visitPurpose?: string | null;
    storeId?: string | null;
    storeName?: string | null;
    province?: string | null;
    isUnregisteredFarmer?: boolean;
    unregisteredFarmerName?: string | null;
    unregisteredFarmerPhone?: string | null;
    targetAmount?: number | null;
    subDealerStore?: string | null;
    remarks?: string | null;
    notes?: string | null;
  }>;
  planProducts?: Array<{
    workTypeCode: string;
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    masterPrice?: number | null;
    unitPrice?: number | null;
    isPriceOverridden?: boolean;
    targetQuantity?: number | null;
    targetAmount?: number | null;
    notes?: string | null;
  }>;
  marketingItems?: Array<{
    category: string;
    materialName: string;
    unit?: string | null;
    unitPrice?: number | null;
    quantity?: number | null;
    totalAmount?: number | null;
  }>;
  promotionItems?: Array<{
    budgetType: string;
    detail: string;
    amount?: number | null;
  }>;
};

/**
 * Create a new ActivityPlan inside a transaction with automatic retry on collision
 */
export async function createActivityPlan(input: CreateActivityPlanInput) {
  const maxRetries = 5;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await db.$transaction(async (tx) => {
        const code = input.code || (await generateActivityPlanCode(tx, input.startDate));
        const fiscal = computeFiscalFields(input.startDate, input.endDate);

        const spRequested = input.salesPromotionBudgetRequested ?? 0;
        const mktRequested = input.marketingBudgetRequested ?? 0;
        const totalRequested = input.totalBudgetRequested ?? (spRequested + mktRequested);

        let primaryCode = "TYPE_1";
        if (input.workTypeCodes && input.workTypeCodes.length > 0) {
          primaryCode = getWorkTypeCode(input.workTypeCodes[0]);
        } else if (input.activityTypeId) {
          primaryCode = getWorkTypeCode(input.activityTypeId);
        }
        const resolvedPrimaryTypeId = await resolveActivityTypeId(primaryCode, tx);

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
            activityTypeId: resolvedPrimaryTypeId,
            location: input.location ? input.location.trim() || null : null,
            province: input.province ?? null,
            district: input.district ?? null,
            objective: input.objective,
            description: input.description ?? null,
            notes: input.notes ?? null,
            targetAttendeesCount: input.targetAttendeesCount ?? null,
            targetBookingSales: input.targetBookingSales != null ? new Prisma.Decimal(input.targetBookingSales) : null,
            salesPromotionBudgetRequested: input.salesPromotionBudgetRequested ? new Prisma.Decimal(input.salesPromotionBudgetRequested) : null,
            marketingBudgetRequested: input.marketingBudgetRequested ? new Prisma.Decimal(input.marketingBudgetRequested) : null,
            totalBudgetRequested: new Prisma.Decimal(totalRequested),
            status: input.status ?? ActivityStatus.DRAFT,
            employeeId: input.employeeId,
            createdById: input.createdById,
            currentApproverEmployeeId: input.currentApproverEmployeeId ?? null,
          },
        });

        // 1.1 Create Work Types (Join Table)
        const workTypeCodes = input.workTypeCodes && input.workTypeCodes.length > 0
          ? input.workTypeCodes.map(getWorkTypeCode)
          : [primaryCode];

        for (const wtCode of Array.from(new Set(workTypeCodes))) {
          const typeId = await resolveActivityTypeId(wtCode, tx);
          await tx.activityPlanWorkType.create({
            data: {
              activityPlanId: plan.id,
              activityTypeId: typeId,
            },
          });
        }

        // 1.2 Create Tour if present
        if (input.tourData || primaryCode === "TYPE_12" || workTypeCodes.includes("TYPE_12")) {
          const tourInput = input.tourData;
          const tourType: TourType = tourInput?.tourType === "STORE" ? TourType.STORE : TourType.CENTRAL;
          const tourSize: TourSize | null = tourInput?.tourSize === "LARGE" ? TourSize.LARGE : (tourInput?.tourSize === "SMALL" ? TourSize.SMALL : null);
          const country: string | null = tourInput?.country ?? null;
          const storeId: string | null = tourInput?.storeId ?? null;
          const destination: string | null = tourInput?.destination ?? null;

          await tx.activityPlanTour.create({
            data: {
              activityPlanId: plan.id,
              tourType,
              tourSize,
              country,
              storeId,
              destination,
            },
          });
        }

        // 1.3 Create Stores if present
        if (input.planStores && input.planStores.length > 0) {
          await tx.activityPlanStore.createMany({
            data: input.planStores.map((s) => ({
              activityPlanId: plan.id,
              workTypeCode: getWorkTypeCode(s.workTypeCode),
              visitPurpose: s.visitPurpose ?? null,
              storeId: s.storeId ?? null,
              storeName: s.storeName ?? null,
              province: s.province ?? null,
              isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
              unregisteredFarmerName: s.unregisteredFarmerName ?? null,
              unregisteredFarmerPhone: s.unregisteredFarmerPhone ?? null,
              targetAmount: s.targetAmount != null ? new Prisma.Decimal(s.targetAmount) : null,
              subDealerStore: s.subDealerStore ?? null,
              remarks: s.remarks ?? null,
              notes: s.notes ?? null,
            })),
          });
        }

        // 1.4 Create Products if present
        if (input.planProducts && input.planProducts.length > 0) {
          await tx.activityPlanProduct.createMany({
            data: input.planProducts.map((p) => ({
              activityPlanId: plan.id,
              workTypeCode: getWorkTypeCode(p.workTypeCode),
              storeId: p.storeId ?? null,
              productId: p.productId,
              productName: p.productName ?? null,
              masterPrice: p.masterPrice != null ? new Prisma.Decimal(p.masterPrice) : null,
              unitPrice: p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null,
              isPriceOverridden: p.isPriceOverridden ?? false,
              targetQuantity: p.targetQuantity ?? null,
              targetAmount: p.targetAmount != null ? new Prisma.Decimal(p.targetAmount) : null,
              notes: p.notes ?? null,
            })),
          });
        }

        // 1.5 Create Marketing Items if present
        if (input.marketingItems && input.marketingItems.length > 0) {
          await tx.activityPlanMarketingItem.createMany({
            data: input.marketingItems.map((m) => ({
              activityPlanId: plan.id,
              category: m.category,
              materialName: m.materialName,
              unit: m.unit ?? null,
              unitPrice: new Prisma.Decimal(m.unitPrice ?? 0),
              quantity: m.quantity ?? 1,
              totalAmount: new Prisma.Decimal(m.totalAmount ?? 0),
            })),
          });
        }

        // 1.6 Create Promotion Items if present
        if (input.promotionItems && input.promotionItems.length > 0) {
          await tx.activityPlanPromotionItem.createMany({
            data: input.promotionItems.map((p) => ({
              activityPlanId: plan.id,
              budgetType: p.budgetType,
              detail: p.detail,
              amount: new Prisma.Decimal(p.amount ?? 0),
            })),
          });
        }

        // 1.7 Link Demo Plot Visit if demoPlotId is provided
        if (input.demoPlotId) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId: input.demoPlotId,
              activityPlanId: plan.id,
              visitDate: input.startDate,
            },
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
    } catch (err: any) {
      lastError = err;
      if (err?.code === "P2002" && !input.code && attempt < maxRetries) {
        // Collision detected on code; retry after a tiny jitter
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 20));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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
    const {
      helperEmployeeIds,
      marketingItems,
      promotionItems,
      workTypeCodes,
      tourData,
      planStores,
      planProducts,
      targetAttendeesCount,
      targetBookingSales,
      demoPlotId,
    } = planData;
    const updateFields: any = { ...planData };
    delete updateFields.updatedUserId;
    delete updateFields.helperEmployeeIds;
    delete updateFields.marketingItems;
    delete updateFields.promotionItems;
    delete updateFields.workTypeCodes;
    delete updateFields.tourData;
    delete updateFields.planStores;
    delete updateFields.planProducts;
    delete updateFields.demoPlotId;

    // Build update dataset
    const dataToUpdate: Prisma.ActivityPlanUncheckedUpdateInput = {};

    if (updateFields.title !== undefined) dataToUpdate.title = updateFields.title;
    if (updateFields.activityTypeId !== undefined) {
      dataToUpdate.activityTypeId = await resolveActivityTypeId(updateFields.activityTypeId, tx);
    }
    if (updateFields.location !== undefined) {
      dataToUpdate.location = updateFields.location ? updateFields.location.trim() || null : null;
    }
    if (updateFields.province !== undefined) dataToUpdate.province = updateFields.province;
    if (updateFields.district !== undefined) dataToUpdate.district = updateFields.district;
    if (updateFields.objective !== undefined) dataToUpdate.objective = updateFields.objective;
    if (updateFields.description !== undefined) dataToUpdate.description = updateFields.description;
    if (updateFields.notes !== undefined) dataToUpdate.notes = updateFields.notes;
    if (updateFields.status !== undefined) dataToUpdate.status = updateFields.status;

    if (targetAttendeesCount !== undefined) {
      dataToUpdate.targetAttendeesCount = targetAttendeesCount ?? null;
    }
    if (targetBookingSales !== undefined) {
      dataToUpdate.targetBookingSales = targetBookingSales != null ? new Prisma.Decimal(targetBookingSales) : null;
    }

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

    // 1.1 Sync Work Types
    if (workTypeCodes !== undefined) {
      await tx.activityPlanWorkType.deleteMany({ where: { activityPlanId: id } });
      const codes = workTypeCodes.map(getWorkTypeCode);
      for (const wtCode of Array.from(new Set(codes))) {
        const typeId = await resolveActivityTypeId(wtCode, tx);
        await tx.activityPlanWorkType.create({
          data: {
            activityPlanId: id,
            activityTypeId: typeId,
          },
        });
      }
    }

    // 1.2 Sync Tour
    if (tourData !== undefined) {
      await tx.activityPlanTour.deleteMany({ where: { activityPlanId: id } });
      if (tourData) {
        await tx.activityPlanTour.create({
          data: {
            activityPlanId: id,
            tourType: tourData.tourType === "STORE" ? TourType.STORE : TourType.CENTRAL,
            tourSize: tourData.tourSize === "LARGE" ? TourSize.LARGE : (tourData.tourSize === "SMALL" ? TourSize.SMALL : null),
            country: tourData.country ?? null,
            storeId: tourData.storeId ?? null,
            destination: tourData.destination ?? null,
          },
        });
      }
    }

    // 1.3 Sync Stores
    if (planStores !== undefined) {
      await tx.activityPlanStore.deleteMany({ where: { activityPlanId: id } });
      if (planStores.length > 0) {
        await tx.activityPlanStore.createMany({
          data: planStores.map((s) => ({
            activityPlanId: id,
            workTypeCode: getWorkTypeCode(s.workTypeCode),
            visitPurpose: s.visitPurpose ?? null,
            storeId: s.storeId ?? null,
            storeName: s.storeName ?? null,
            province: s.province ?? null,
            isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
            unregisteredFarmerName: s.unregisteredFarmerName ?? null,
            unregisteredFarmerPhone: s.unregisteredFarmerPhone ?? null,
            targetAmount: s.targetAmount != null ? new Prisma.Decimal(s.targetAmount) : null,
            subDealerStore: s.subDealerStore ?? null,
            remarks: s.remarks ?? null,
            notes: s.notes ?? null,
          })),
        });
      }
    }

    // 1.4 Sync Products
    if (planProducts !== undefined) {
      await tx.activityPlanProduct.deleteMany({ where: { activityPlanId: id } });
      if (planProducts.length > 0) {
        await tx.activityPlanProduct.createMany({
          data: planProducts.map((p) => ({
            activityPlanId: id,
            workTypeCode: getWorkTypeCode(p.workTypeCode),
            storeId: p.storeId ?? null,
            productId: p.productId,
            productName: p.productName ?? null,
            masterPrice: p.masterPrice != null ? new Prisma.Decimal(p.masterPrice) : null,
            unitPrice: p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null,
            isPriceOverridden: p.isPriceOverridden ?? false,
            targetQuantity: p.targetQuantity ?? null,
            targetAmount: p.targetAmount != null ? new Prisma.Decimal(p.targetAmount) : null,
            notes: p.notes ?? null,
          })),
        });
      }
    }

    // 1.5 Sync Marketing Items
    if (marketingItems !== undefined) {
      await tx.activityPlanMarketingItem.deleteMany({ where: { activityPlanId: id } });
      if (marketingItems.length > 0) {
        await tx.activityPlanMarketingItem.createMany({
          data: marketingItems.map((m) => ({
            activityPlanId: id,
            category: m.category,
            materialName: m.materialName,
            unit: m.unit ?? null,
            unitPrice: new Prisma.Decimal(m.unitPrice ?? 0),
            quantity: m.quantity ?? 1,
            totalAmount: new Prisma.Decimal(m.totalAmount ?? 0),
          })),
        });
      }
    }

    // 1.6 Sync Promotion Items
    if (promotionItems !== undefined) {
      await tx.activityPlanPromotionItem.deleteMany({ where: { activityPlanId: id } });
      if (promotionItems.length > 0) {
        await tx.activityPlanPromotionItem.createMany({
          data: promotionItems.map((p) => ({
            activityPlanId: id,
            budgetType: p.budgetType,
            detail: p.detail,
            amount: new Prisma.Decimal(p.amount ?? 0),
          })),
        });
      }
    }

    // 1.7 Sync Demo Plot Visit
    if (demoPlotId !== undefined) {
      await tx.demoPlotVisit.deleteMany({ where: { activityPlanId: id } });
      if (demoPlotId) {
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId,
            activityPlanId: id,
            visitDate: updatedPlan.startDate,
          },
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
  discussionResult?: string | null;
  productAdvice?: string | null;
  salesOpportunity?: string | null;
  problemFound?: string | null;
  nextAction?: string | null;
  nextMeetingDate?: Date | null;
  farmerHomeAddress?: string | null;
  plotLatitude?: number | Prisma.Decimal | null;
  plotLongitude?: number | Prisma.Decimal | null;
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
  recordedById?: string | null;
  saleResults?: Array<{
    workTypeCode: string;
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    actualQuantity: number;
    actualUnitPrice: number;
    actualTotal: number;
    unclosedReason?: string | null;
  }>;
  stockResults?: Array<{
    storeId: string;
    productId: string;
    remainingQuantity: number;
    stockStatus?: string | null;
    reorderOpportunity?: string | null;
    remarks?: string | null;
  }>;
  surveyResults?: Array<{
    storeId: string;
    productId?: string | null;
    competitorBrand: string;
    competitorProduct: string;
    competitorPrice?: number | null;
    competitorUnit?: string | null;
    promotionDetail?: string | null;
  }>;
  demoResults?: Array<{
    demoPlotId?: string | null;
    plannedProductId?: string | null;
    actualProductId?: string | null;
    changeReason?: string | null;
    plotObjective?: string | null;
    cropAgeValue?: string | null;
    cropAgeUnit?: string | null;
    growthStage?: string | null;
    cropCondition?: string | null;
    productResponse?: string | null;
    problemDescription?: string | null;
    finalYieldKg?: number | null;
    controlYieldKg?: number | null;
    satisfactionScore?: number | null;
  }>;
  followupResults?: Array<{
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    usageResult?: string | null;
    followupDetail?: string | null;
    problemDetail?: string | null;
    isAdditional?: boolean;
  }>;
  attachments?: Array<{
    workTypeCode?: string | null;
    storeId?: string | null;
    productId?: string | null;
    category?: AttachmentCategory;
    fileUrl: string;
    fileName: string;
    fileSize?: number | null;
    mimeType?: string | null;
  }>;
};

/**
 * Create or update ActivityResult (Post-activity outcome recording)
 */
export async function upsertActivityResult(
  input: CreateActivityResultInput,
  txClient?: Prisma.TransactionClient,
) {
  const handler = async (tx: Prisma.TransactionClient) => {
    const spSpent = input.actualSalesPromotionSpent ?? 0;
    const mktSpent = input.actualMarketingSpent ?? 0;
    const actualTotalSpent = spSpent + mktSpent;

    const result = await tx.activityResult.upsert({
      where: { activityPlanId: input.activityPlanId },
      create: {
        activityPlanId: input.activityPlanId,
        actualStartDate: input.actualStartDate,
        actualEndDate: input.actualEndDate,
        actualAttendeesCount: input.actualAttendeesCount ?? null,
        resultStatus: input.resultStatus ?? ActivityResultStatus.COMPLETED,
        resultSummary: input.resultSummary ?? null,
        discussionResult: input.discussionResult ?? null,
        productAdvice: input.productAdvice ?? null,
        salesOpportunity: input.salesOpportunity ?? null,
        problemFound: input.problemFound ?? null,
        nextAction: input.nextAction ?? null,
        nextMeetingDate: input.nextMeetingDate ?? null,
        farmerHomeAddress: input.farmerHomeAddress ?? null,
        plotLatitude: input.plotLatitude != null ? new Prisma.Decimal(input.plotLatitude) : null,
        plotLongitude: input.plotLongitude != null ? new Prisma.Decimal(input.plotLongitude) : null,
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
        recordedById: input.recordedById ?? null,
      },
      update: {
        actualStartDate: input.actualStartDate,
        actualEndDate: input.actualEndDate,
        actualAttendeesCount: input.actualAttendeesCount ?? null,
        resultStatus: input.resultStatus ?? ActivityResultStatus.COMPLETED,
        resultSummary: input.resultSummary ?? null,
        discussionResult: input.discussionResult ?? null,
        productAdvice: input.productAdvice ?? null,
        salesOpportunity: input.salesOpportunity ?? null,
        problemFound: input.problemFound ?? null,
        nextAction: input.nextAction ?? null,
        nextMeetingDate: input.nextMeetingDate ?? null,
        farmerHomeAddress: input.farmerHomeAddress ?? null,
        plotLatitude: input.plotLatitude != null ? new Prisma.Decimal(input.plotLatitude) : null,
        plotLongitude: input.plotLongitude != null ? new Prisma.Decimal(input.plotLongitude) : null,
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
        recordedById: input.recordedById ?? null,
      },
    });

    // 1. Sync Sale Results
    if (input.saleResults !== undefined) {
      await tx.activityResultSaleItem.deleteMany({ where: { activityResultId: result.id } });
      if (input.saleResults.length > 0) {
        await tx.activityResultSaleItem.createMany({
          data: input.saleResults.map((item) => ({
            activityResultId: result.id,
            workTypeCode: getWorkTypeCode(item.workTypeCode),
            storeId: item.storeId ?? null,
            productId: item.productId,
            productName: item.productName ?? null,
            actualQuantity: item.actualQuantity,
            actualUnitPrice: new Prisma.Decimal(item.actualUnitPrice),
            actualTotal: new Prisma.Decimal(item.actualTotal),
            unclosedReason: item.unclosedReason ?? null,
          })),
        });
      }
    }

    // 2. Sync Stock Results
    if (input.stockResults !== undefined) {
      await tx.activityResultStockItem.deleteMany({ where: { activityResultId: result.id } });
      if (input.stockResults.length > 0) {
        await tx.activityResultStockItem.createMany({
          data: input.stockResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId,
            productId: item.productId,
            remainingQuantity: item.remainingQuantity,
            stockStatus: item.stockStatus ?? null,
            reorderOpportunity: item.reorderOpportunity ?? null,
            remarks: item.remarks ?? null,
          })),
        });
      }
    }

    // 3. Sync Survey Results
    if (input.surveyResults !== undefined) {
      await tx.activityResultSurveyItem.deleteMany({ where: { activityResultId: result.id } });
      if (input.surveyResults.length > 0) {
        await tx.activityResultSurveyItem.createMany({
          data: input.surveyResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId,
            productId: item.productId ?? null,
            competitorBrand: item.competitorBrand,
            competitorProduct: item.competitorProduct,
            competitorPrice: item.competitorPrice != null ? new Prisma.Decimal(item.competitorPrice) : null,
            competitorUnit: item.competitorUnit ?? null,
            promotionDetail: item.promotionDetail ?? null,
          })),
        });
      }
    }

    // 4. Sync Demo Results
    if (input.demoResults !== undefined) {
      await tx.activityResultDemoItem.deleteMany({ where: { activityResultId: result.id } });
      if (input.demoResults.length > 0) {
        await tx.activityResultDemoItem.createMany({
          data: input.demoResults.map((item) => ({
            activityResultId: result.id,
            demoPlotId: item.demoPlotId ?? null,
            plannedProductId: item.plannedProductId ?? null,
            actualProductId: item.actualProductId ?? null,
            changeReason: item.changeReason ?? null,
            plotObjective: item.plotObjective ?? null,
            cropAgeValue: item.cropAgeValue ?? null,
            cropAgeUnit: item.cropAgeUnit ?? null,
            growthStage: item.growthStage ?? null,
            cropCondition: item.cropCondition ?? null,
            productResponse: item.productResponse ?? null,
            problemDescription: item.problemDescription ?? null,
            finalYieldKg: item.finalYieldKg != null ? new Prisma.Decimal(item.finalYieldKg) : null,
            controlYieldKg: item.controlYieldKg != null ? new Prisma.Decimal(item.controlYieldKg) : null,
            satisfactionScore: item.satisfactionScore ?? null,
          })),
        });
      }
    }

    // 5. Sync Followup Results
    if (input.followupResults !== undefined) {
      await tx.activityResultFollowupItem.deleteMany({ where: { activityResultId: result.id } });
      if (input.followupResults.length > 0) {
        await tx.activityResultFollowupItem.createMany({
          data: input.followupResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId ?? null,
            productId: item.productId,
            productName: item.productName ?? null,
            usageResult: item.usageResult ?? null,
            followupDetail: item.followupDetail ?? null,
            problemDetail: item.problemDetail ?? null,
            isAdditional: Boolean(item.isAdditional),
          })),
        });
      }
    }

    // 6. Sync Attachments
    if (input.attachments !== undefined) {
      await tx.activityAttachment.deleteMany({ where: { activityResultId: result.id } });
      if (input.attachments.length > 0) {
        await tx.activityAttachment.createMany({
          data: input.attachments.map((att) => ({
            activityPlanId: input.activityPlanId,
            activityResultId: result.id,
            workTypeCode: att.workTypeCode ? getWorkTypeCode(att.workTypeCode) : null,
            storeId: att.storeId ?? null,
            productId: att.productId ?? null,
            category: att.category ?? AttachmentCategory.GENERAL,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileSize: att.fileSize ?? null,
            mimeType: att.mimeType ?? null,
          })),
        });
      }
    }

    return result;
  };

  if (txClient) {
    return handler(txClient);
  }
  return db.$transaction(handler);
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
          select: { id: true, name: true, customerCode: true, customerType: true, province: true, district: true },
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
        saleResults: true,
        stockResults: true,
        surveyResults: true,
        demoResults: true,
        followupResults: true,
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
  plantingDate?: Date | null;
  plantingAreaCondition?: string | null;
  usageMethod?: string | null;
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
      plantingDate: data.plantingDate ?? null,
      plantingAreaCondition: data.plantingAreaCondition ?? null,
      usageMethod: data.usageMethod ?? null,
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
  cropImageUrls?: string[];
  plotImageUrls?: string[];
  imageUrls?: string[];
  notes?: string | null;
  plantingDate?: Date | null;
  plantingAreaCondition?: string | null;
  plotStatus?: DemoPlotStatus;
  finalYieldKg?: number | null;
  controlYieldKg?: number | null;
  yieldIncreasePercent?: number | null;
  farmerSatisfaction?: number | null;
  commercialPotential?: string | null;
  finalSummaryNotes?: string | null;
}) {
  let plot = await db.demoPlot.findFirst({
    where: {
      OR: [
        { id: data.demoPlotId },
        { code: data.demoPlotId },
        { name: data.demoPlotId },
      ],
      deletedAt: null,
    },
    include: { visits: true },
  });

  // If plot not found in demo_plots table, look up ActivityPlan and Auto-Create DemoPlot Master
  if (!plot) {
    let plan: any = null;

    if (data.activityPlanId) {
      plan = await db.activityPlan.findUnique({
        where: { id: data.activityPlanId },
        include: {
          stores: { include: { store: true } },
          demoPlotVisits: { include: { demoPlot: true } },
        },
      });
      if (plan?.demoPlotVisits && plan.demoPlotVisits.length > 0) {
        plot = plan.demoPlotVisits[0].demoPlot;
      }
    }

    if (!plot) {
      const ownerName = plan?.stores?.[0]?.store?.name || plan?.location || "เกษตรกร";
      const cropName = "พืชทั่วไป";
      const productName = "สินค้าสาธิต";
      const plotName = `${ownerName} - ${cropName}`;

      // Check if matching plot already exists by ownerName + cropName
      plot = await db.demoPlot.findFirst({
        where: {
          ownerName,
          cropName,
          deletedAt: null,
        },
        include: { visits: true },
      });

      if (!plot) {
        const count = await db.demoPlot.count();
        const code = `DP-${new Date().getFullYear().toString().slice(-2)}${(count + 1).toString().padStart(4, "0")}`;

        plot = await db.demoPlot.create({
          data: {
            code,
            name: plotName,
            ownerName,
            customerId: plan?.stores?.[0]?.storeId || null,
            employeeId: plan?.employeeId || "emp-system",
            cropCategory: "พืชทั่วไป",
            cropName,
            primaryProductName: productName,
            areaRai: null,
            treeCount: null,
            startDate: plan?.startDate || data.visitDate,
            plantingDate: data.plantingDate || plan?.startDate || data.visitDate,
            plantingAreaCondition: data.plantingAreaCondition || null,
            usageMethod: data.usageMethod || null,
            objective: plan?.objective || null,
            experimentDetail: null,
            status: data.plotStatus || DemoPlotStatus.IN_PROGRESS,
          },
          include: { visits: true },
        });
      }
    }
  }

  const visitNumber = plot.visits.length + 1;
  const msPerDay = 1000 * 60 * 60 * 24;
  const baseStartDate = plot.plantingDate || plot.startDate;
  const daysSinceStart = Math.max(
    0,
    Math.floor(
      (data.visitDate.getTime() - new Date(baseStartDate).getTime()) / msPerDay,
    ),
  );

  const productUsedQty = data.productUsedQty || 0;
  const productUnitPrice = data.productUnitPrice || 0;
  const productCost = productUsedQty * productUnitPrice;
  const otherExpenses = data.otherExpenses || 0;
  const totalVisitCost = productCost + otherExpenses;

  const cropImageUrls = data.cropImageUrls || [];
  const plotImageUrls = data.plotImageUrls || [];
  const legacyImageUrls = data.imageUrls || plotImageUrls;

  return db.$transaction(async (tx) => {
    const visit = await tx.demoPlotVisit.create({
      data: {
        demoPlotId: plot.id,
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
        cropImageUrls,
        plotImageUrls,
        imageUrls: legacyImageUrls,
        notes: data.notes ?? null,
      },
    });

    // Update master plot initial info if not yet set or provided on visit 1
    const plotUpdateData: any = {};
    if (data.plantingDate && !plot.plantingDate) {
      plotUpdateData.plantingDate = data.plantingDate;
    }
    if (data.plantingAreaCondition && !plot.plantingAreaCondition) {
      plotUpdateData.plantingAreaCondition = data.plantingAreaCondition;
    }
    if (data.usageMethod && !plot.usageMethod) {
      plotUpdateData.usageMethod = data.usageMethod;
    }

    if (data.plotStatus && data.plotStatus !== plot.status) {
      plotUpdateData.status = data.plotStatus;
      plotUpdateData.closedDate =
        data.plotStatus === DemoPlotStatus.COMPLETED ||
        data.plotStatus === DemoPlotStatus.FAILED
          ? data.visitDate
          : null;
      if (data.finalYieldKg) {
        plotUpdateData.demoYieldKg = new Prisma.Decimal(data.finalYieldKg);
      }
      if (data.controlYieldKg) {
        plotUpdateData.controlYieldKg = new Prisma.Decimal(data.controlYieldKg);
      }
      if (data.yieldIncreasePercent) {
        plotUpdateData.yieldIncreasePercent = new Prisma.Decimal(
          data.yieldIncreasePercent,
        );
      }
      if (data.farmerSatisfaction) {
        plotUpdateData.farmerSatisfaction = data.farmerSatisfaction;
      }
      if (data.commercialPotential) {
        plotUpdateData.commercialPotential = data.commercialPotential;
      }
      if (data.finalSummaryNotes) {
        plotUpdateData.finalSummaryNotes = data.finalSummaryNotes;
      }
    }

    if (Object.keys(plotUpdateData).length > 0) {
      await tx.demoPlot.update({
        where: { id: plot.id },
        data: plotUpdateData,
      });
    }

    return visit;
  });
}

/**
 * Fetch Farmer Customers to retrieve farm plots
 */
export async function findFarmerCustomersForPlots() {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { customerType: "FARMER" },
        { farmPlots: { not: Prisma.DbNull } },
      ],
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      farmPlots: true,
      addresses: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch all master demo plots with visits (excluding CANCELLED and deleted plots)
 */
export async function findMasterDemoPlots() {
  return db.demoPlot.findMany({
    where: {
      deletedAt: null,
      status: { not: DemoPlotStatus.CANCELLED },
    },
    include: {
      visits: {
        orderBy: { visitDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch Farmer customers for selection in Field Day
 */
export async function findFarmerCustomerOptions(province?: string) {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      customerType: "FARMER",
      ...(province && province.trim() ? { province: province.trim() } : {}),
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      customerType: true,
      phone: true,
      farmPlots: true,
      province: true,
      district: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch Dealer & Subdealer customers for selection in TYPE_1 Visit (Store)
 */
export async function findDealerAndSubdealerCustomerOptions() {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      customerType: {
        in: ["DEALER", "SUBDEALER"],
      },
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      customerType: true,
      phone: true,
      province: true,
      district: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch Demo plot owners for selection in Field Day
 */
export async function findDemoPlotOwners() {
  return db.demoPlot.findMany({
    where: { deletedAt: null },
    select: { ownerName: true, areaRai: true, cropName: true },
  });
}

/**
 * Find demo plot by ID, Name, Code, or OwnerName
 */
export async function findDemoPlotByIdOrName(demoPlotIdOrName: string) {
  return db.demoPlot.findFirst({
    where: {
      OR: [
        { id: demoPlotIdOrName },
        { name: demoPlotIdOrName },
        { code: demoPlotIdOrName },
        { ownerName: demoPlotIdOrName },
      ],
      deletedAt: null,
    },
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

/**
 * Find demo plot by owner name and crop name
 */
export async function findDemoPlotByOwnerAndCrop(ownerName: string, cropName: string) {
  return db.demoPlot.findFirst({
    where: { ownerName, cropName, deletedAt: null },
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

