import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  Prisma,
  ActivityPlanType,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
  ActivityResultStatus,
  ActivityResultAction,
  DemoPlotStatus,
  TourType,
  TourSize,
  AttachmentCategory,
} from "@prisma/client";
import {
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
} from "../constants";
import {
  createType7aPlots,
  syncType7aPlots,
  Type7aPlotInput,
} from "./type-7a.repository";
import { createType7bData, syncType7bData } from "./type-7b.repository";
import { createType13Data, syncType13Data, Type13DataInput } from "./type-13.repository";
import { createType14Data, syncType14Data, Type14DataInput } from "./type-14.repository";
import { upsertActivityResult, CreateActivityResultInput } from "./activity-result.repository";
export { upsertActivityResult, type CreateActivityResultInput };

export * from "./demo-plot.repository";
export * from "./type-7a.repository";
export * from "./type-7b.repository";
export * from "./type-13.repository";
export * from "./type-14.repository";
export * from "./activity-result.repository";
export * from "./activity-approval.repository";

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
  tx: Prisma.TransactionClient | typeof db = db,
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
  const plan = await db.activityPlan.findFirst({
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
            select: {
              id: true,
              name: true,
              productCode: true,
              price: true,
              unit: true,
              packageSizeUnit: true,
              categoryId: true,
              category: {
                select: { id: true, code: true, description: true },
              },
              productGroupId: true,
              productGroup: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          store: {
            select: { id: true, name: true, customerCode: true },
          },
        },
      },
      tour: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              province: true,
            },
          },
        },
      },
      type7aPlots: {
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
          },
        },
      },
      type7b: {
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
          },
        },
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
            orderBy: { plotIndex: "asc" },
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
            orderBy: { sortOrder: "asc" },
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
            orderBy: { sortOrder: "asc" },
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
          attachments: true,
          demoPlot: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  customerCode: true,
                  customerType: true,
                  province: true,
                  district: true,
                },
              },
              farmerCustomer: {
                select: {
                  id: true,
                  name: true,
                  customerCode: true,
                  customerType: true,
                  province: true,
                  district: true,
                  phone: true,
                },
              },
              demoProducts: {
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
              },
              externalProducts: true,
              irrigations: true,
              attachments: true,
            },
          },
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
          logs: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
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
              attachments: true,
            },
          },
          demoResults: {
            include: {
              plannedProduct: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                  unit: true,
                  packageSizeUnit: true,
                },
              },
              actualProduct: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                  unit: true,
                  packageSizeUnit: true,
                },
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
          issueResults: {
            include: {
              product: {
                select: { id: true, name: true, productCode: true },
              },
              store: {
                select: { id: true, name: true, customerCode: true },
              },
              attachments: true,
            },
          },
          sprayRounds: {
            include: {
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
              },
              externalProducts: true,
              attachments: true,
            },
            orderBy: { roundNumber: "asc" },
          },
          attachments: true,
        },
      },
      attachments: true,
    },
  });

  if (plan) {
    (plan as any).demoPlot = plan.demoPlotVisits?.[0]?.demoPlot || null;
  }
  return plan;
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
          select: {
            id: true,
            name: true,
            positionTitle: true,
            departmentName: true,
          },
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
  date: Date = new Date(),
): Promise<string> {
  const yearStr = String(date.getFullYear()).slice(-2);
  const monthStr = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `TP${yearStr}${monthStr}`;

  // 1. Transaction-level advisory lock to serialize concurrent code generation for the same monthly prefix
  try {
    await (tx as any)
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;
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

/**
 * Helper to generate Demo Plot Code (format: DPYYMMXXXX)
 * Uses strict regex parsing, transaction advisory lock, and collision protection.
 */
export async function generateDemoPlotCode(
  tx: Prisma.TransactionClient | typeof db,
  date: Date = new Date(),
  offset: number = 0,
): Promise<string> {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const yearStr = String(d.getFullYear()).slice(-2);
  const monthStr = String(d.getMonth() + 1).padStart(2, "0");
  const prefix = `DP${yearStr}${monthStr}`;

  // 1. Transaction-level advisory lock to serialize concurrent code generation for the same monthly prefix
  try {
    await (tx as any)
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;
  } catch {
    // If not supported or outside transaction, proceed with regex-based scan
  }

  // 2. Fetch all existing demo plots matching the prefix
  const existingPlots = await tx.demoPlot.findMany({
    where: {
      code: { startsWith: prefix },
    },
    select: { code: true },
  });

  // 3. Extract max numeric sequence strictly matching DPYYMM\\d{4}
  let maxSeq = 0;
  const codeRegex = new RegExp(`^${prefix}(\\d{4})$`);

  for (const p of existingPlots) {
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

  const nextSeq = maxSeq + 1 + offset;
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
  demoPlotIds?: string[] | null;
  demoPlotData?: {
    id?: string | null;
    name: string;
    customerId?: string | null;
    ownerName: string;
    cropCategory: string;
    cropName: string;
    customCropName?: string | null;
    areaRai?: number | null;
    treeCount?: number | null;
    location?: string | null;
    province?: string | null;
    district?: string | null;
    categoryId?: string | null;
    objective?: string | null;
  } | null;
  salesPromotionBudgetRequested?: number | null;
  marketingBudgetRequested?: number | null;
  totalBudgetRequested?: number | null;
  hasProductWithdrawal?: boolean | null;
  planType?: ActivityPlanType;
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
  type13Data?: Type13DataInput;
  type13Plots?: Array<{
    id?: string;
    demoPlotId?: string | null;
    name: string;
    storeId: string;
    ownerName?: string | null;
    province: string;
    district: string;
    products?: Array<{
      productId: string;
      productName?: string | null;
      quantity?: number | string | null;
      unit?: string | null;
    }>;
  }>;
  type14Data?: Type14DataInput;
  type7aPlots?: Type7aPlotInput[];
  type7bData?: {
    sourceActivityPlanId?: string | null;
    demoPlotId?: string | null;
    storeId?: string | null;
    dealerName?: string | null;
    farmerName?: string | null;
    farmerPhone?: string | null;
    province?: string | null;
    district?: string | null;
    cropCategory?: string | null;
    cropName?: string | null;
    areaRai?: number | null;
    treeCount?: number | null;
    sprayRound?: number | null;
    sprayDate?: Date | string | null;
    daysSinceStart?: number | null;
    cropAgeValue?: number | null;
    cropAgeUnit?: string | null;
    growthStage?: string | null;
    cropCondition?: string | null;
    sprayMethod?: string | null;
    sprayEquipment?: string | null;
    otherEquipment?: string | null;
    notes?: string | null;
    plots?: Array<{
      demoPlotId?: string | null;
      plotName?: string | null;
      cropName?: string | null;
      ownerName?: string | null;
      farmerName?: string | null;
      province?: string | null;
      district?: string | null;
      areaRai?: number | null;
      treeCount?: number | null;
      dealerName?: string | null;
      dealerStoreName?: string | null;
      latitude?: number | Prisma.Decimal | null;
      longitude?: number | Prisma.Decimal | null;
      notes?: string | null;
    }>;
    products?: Array<{
      productId: string;
      productName?: string | null;
      plannedRate?: string | null;
      actualRate?: string | null;
      quantity?: number | null;
      quantityUsed?: number | null;
      unit?: string | null;
      notes?: string | null;
    }>;
  } | null;
  actualData?: any;
};

/**
 * Create a new ActivityPlan inside a transaction with automatic retry on collision
 */
export async function createActivityPlan(
  input: CreateActivityPlanInput,
  txClient?: Prisma.TransactionClient,
) {
  const executeInTx = async (tx: Prisma.TransactionClient) => {
    const code =
      input.code || (await generateActivityPlanCode(tx, input.startDate));
    const fiscal = computeFiscalFields(input.startDate, input.endDate);

    const spRequested = input.salesPromotionBudgetRequested ?? 0;
    const mktRequested = input.marketingBudgetRequested ?? 0;
    const totalRequested =
      input.totalBudgetRequested ?? spRequested + mktRequested;

    let primaryCode = "TYPE_1";
    if (input.workTypeCodes && input.workTypeCodes.length > 0) {
      primaryCode = getWorkTypeCode(input.workTypeCodes[0]);
    } else if (input.activityTypeId) {
      primaryCode = getWorkTypeCode(input.activityTypeId);
    }
    const resolvedPrimaryTypeId = await resolveActivityTypeId(
      primaryCode,
      tx,
    );

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
        planType: input.planType ?? ActivityPlanType.PLANNED,
        location: input.location ? input.location.trim() || null : null,
        province: input.province ?? null,
        district: input.district ?? null,
            objective: input.objective,
            description: input.description ?? null,
            notes: input.notes ?? null,
            targetAttendeesCount: input.targetAttendeesCount ?? null,
            targetBookingSales:
              input.targetBookingSales != null
                ? new Prisma.Decimal(input.targetBookingSales)
                : null,
            salesPromotionBudgetRequested: input.salesPromotionBudgetRequested
              ? new Prisma.Decimal(input.salesPromotionBudgetRequested)
              : null,
            marketingBudgetRequested: input.marketingBudgetRequested
              ? new Prisma.Decimal(input.marketingBudgetRequested)
              : null,
            totalBudgetRequested: new Prisma.Decimal(totalRequested),
            hasProductWithdrawal: input.hasProductWithdrawal ?? false,
            status: input.status ?? ActivityStatus.DRAFT,
            employeeId: input.employeeId,
            createdById: input.createdById,
            currentApproverEmployeeId: input.currentApproverEmployeeId ?? null,
          },
        });

        // 1.1 Create Work Types (Join Table)
        const workTypeCodes =
          input.workTypeCodes && input.workTypeCodes.length > 0
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
        if (
          input.tourData ||
          primaryCode === "TYPE_12" ||
          workTypeCodes.includes("TYPE_12")
        ) {
          const tourInput = input.tourData;
          const tourType: TourType =
            tourInput?.tourType === "STORE" ? TourType.STORE : TourType.CENTRAL;
          const tourSize: TourSize | null =
            tourInput?.tourSize === "LARGE"
              ? TourSize.LARGE
              : tourInput?.tourSize === "SMALL"
                ? TourSize.SMALL
                : null;
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
              targetAmount:
                s.targetAmount != null
                  ? new Prisma.Decimal(s.targetAmount)
                  : null,
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
              masterPrice:
                p.masterPrice != null
                  ? new Prisma.Decimal(p.masterPrice)
                  : null,
              unitPrice:
                p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null,
              isPriceOverridden: p.isPriceOverridden ?? false,
              targetQuantity: p.targetQuantity ?? null,
              targetAmount:
                p.targetAmount != null
                  ? new Prisma.Decimal(p.targetAmount)
                  : null,
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

        // 1.7 Create/Link Demo Plot Visit
        if (input.demoPlotData) {
          let plotId = input.demoPlotData.id;
          if (!plotId) {
            const code = await generateDemoPlotCode(
              tx,
              input.startDate ? new Date(input.startDate) : new Date(),
            );

            const plot = await tx.demoPlot.create({
              data: {
                code,
                name: input.demoPlotData.name,
                ownerName: input.demoPlotData.ownerName || "",
                customerId: input.demoPlotData.customerId || null,
                employeeId: input.employeeId,
                cropCategory: input.demoPlotData.cropCategory,
                cropName: input.demoPlotData.cropName,
                customCropName: input.demoPlotData.customCropName || null,
                areaRai:
                  input.demoPlotData.areaRai != null
                    ? new Prisma.Decimal(input.demoPlotData.areaRai)
                    : null,
                treeCount: input.demoPlotData.treeCount || null,
                location: input.demoPlotData.location || null,
                province: input.demoPlotData.province || null,
                district: input.demoPlotData.district || null,
                objective: input.demoPlotData.objective || null,
                startDate: input.startDate,
                status: DemoPlotStatus.IN_PROGRESS,
              },
            });
            plotId = plot.id;
          } else {
            await tx.demoPlot.update({
              where: { id: plotId },
              data: {
                name: input.demoPlotData.name,
                ownerName: input.demoPlotData.ownerName || "",
                customerId: input.demoPlotData.customerId || null,
                cropCategory: input.demoPlotData.cropCategory,
                cropName: input.demoPlotData.cropName,
                customCropName: input.demoPlotData.customCropName || null,
                areaRai:
                  input.demoPlotData.areaRai != null
                    ? new Prisma.Decimal(input.demoPlotData.areaRai)
                    : null,
                treeCount: input.demoPlotData.treeCount || null,
                location: input.demoPlotData.location || null,
                province: input.demoPlotData.province || null,
                district: input.demoPlotData.district || null,
                objective: input.demoPlotData.objective || null,
              },
            });
          }

          await tx.demoPlotVisit.create({
            data: {
              demoPlotId: plotId,
              activityPlanId: plan.id,
              visitDate: input.startDate,
            },
          });
        } else if (
          ((input.demoPlotIds && input.demoPlotIds.length > 0) ||
            input.demoPlotId) &&
          !(input.type13Plots && input.type13Plots.length > 0) &&
          !input.type7bData &&
          !(input.type7aPlots && input.type7aPlots.length > 0) &&
          !input.type14Data
        ) {
          const plotIdsToVisit =
            input.demoPlotIds && input.demoPlotIds.length > 0
              ? input.demoPlotIds
              : input.demoPlotId
                ? [input.demoPlotId]
                : [];

          const isType10 =
            workTypeCodes.includes("TYPE_10") || primaryCode === "TYPE_10";
          const isType7B =
            workTypeCodes.includes("TYPE_7B") || primaryCode === "TYPE_7B";
          const isType14 =
            workTypeCodes.includes("TYPE_14") || primaryCode === "TYPE_14";
          const visitWorkType = isType10
            ? "TYPE_10"
            : isType7B
              ? "TYPE_7B"
              : isType14
                ? "TYPE_14"
                : workTypeCodes[0] || null;

          for (const pid of plotIdsToVisit) {
            const existingPlot = await tx.demoPlot.findUnique({
              where: { id: pid },
              select: { id: true },
            });

            if (existingPlot) {
              await tx.demoPlotVisit.create({
                data: {
                  demoPlotId: existingPlot.id,
                  activityPlanId: plan.id,
                  workTypeCode: visitWorkType,
                  visitDate: input.startDate,
                },
              });
            }
          }
        }

        // 1.8 TYPE_13 ("ฉีดแปลงแฮตแทค"): ActivityPlanType13 + ActivityPlanType13Plot + ActivityPlanType13Product
        if (input.type13Data || (input.type13Plots && input.type13Plots.length > 0)) {
          const t13Payload: Type13DataInput = input.type13Data || {
            plots: input.type13Plots?.map((p, idx) => ({
              ...p,
              plotIndex: idx + 1,
            })),
          };
          await createType13Data(
            tx,
            plan.id,
            t13Payload,
            input.startDate,
            input.employeeId,
          );
        }

        // 1.9 TYPE_14 ("ติดตามแปลงแฮทแทค"): ActivityPlanType14 + ActivityPlanType14Plot + ActivityPlanType14Product
        if (input.type14Data) {
          await createType14Data(
            tx,
            plan.id,
            input.type14Data,
            input.startDate,
            input.employeeId,
          );
        }

        // 1.8.1 TYPE_7A ("ทำแปลงสาธิตใหม่"): ActivityPlanType7a + ActivityPlanType7aProduct
        if (input.type7aPlots && input.type7aPlots.length > 0) {
          await createType7aPlots(
            tx,
            plan.id,
            input.type7aPlots,
            input.startDate,
            input.employeeId,
          );
        }

        // 1.8.2 TYPE_7B ("ติดตามแปลงสาธิต"): ActivityPlanType7b + ActivityPlanType7bPlot + ActivityPlanType7bProduct
        if (input.type7bData) {
          await createType7bData(
            tx,
            plan.id,
            input.type7bData,
            input.startDate,
          );
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
                departmentName:
                  emp?.departmentName || emp?.department?.name || null,
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
            comment:
              input.planType === ActivityPlanType.UNPLANNED
                ? "บันทึกกิจกรรมนอกแผนร่างแรก"
                : "บันทึกแผนงานร่างแรก",
          },
        });

        // 5. If Unplanned Activity provides actualData, upsert ActivityResult atomically
        if (input.actualData) {
          await upsertActivityResult(
            {
              ...input.actualData,
              activityPlanId: plan.id,
              recordedById: input.createdById,
            },
            tx,
          );
        }

        return plan;
      };

  if (txClient) {
    return executeInTx(txClient);
  }

  const maxRetries = 5;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await db.$transaction(executeInTx);
    } catch (err: any) {
      lastError = err;
      if (err?.code === "P2002" && !input.code && attempt < maxRetries) {
        // Collision detected on code; retry after a tiny jitter
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 50 + 20),
        );
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
  },
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
      demoPlotIds,
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
    delete updateFields.demoPlotIds;
    delete updateFields.demoPlotData;
    delete updateFields.type7aPlots;
    delete updateFields.type7bData;

    // Build update dataset
    const dataToUpdate: Prisma.ActivityPlanUncheckedUpdateInput = {};

    if (updateFields.title !== undefined)
      dataToUpdate.title = updateFields.title;
    if (updateFields.activityTypeId !== undefined) {
      dataToUpdate.activityTypeId = await resolveActivityTypeId(
        updateFields.activityTypeId,
        tx,
      );
    }
    if (updateFields.location !== undefined) {
      dataToUpdate.location = updateFields.location
        ? updateFields.location.trim() || null
        : null;
    }
    if (updateFields.province !== undefined)
      dataToUpdate.province = updateFields.province;
    if (updateFields.district !== undefined)
      dataToUpdate.district = updateFields.district;
    if (updateFields.objective !== undefined)
      dataToUpdate.objective = updateFields.objective;
    if (updateFields.description !== undefined)
      dataToUpdate.description = updateFields.description;
    if (updateFields.notes !== undefined)
      dataToUpdate.notes = updateFields.notes;
    if (updateFields.status !== undefined)
      dataToUpdate.status = updateFields.status;
    if (updateFields.hasProductWithdrawal !== undefined) {
      dataToUpdate.hasProductWithdrawal = updateFields.hasProductWithdrawal ?? false;
    }

    if (targetAttendeesCount !== undefined) {
      dataToUpdate.targetAttendeesCount = targetAttendeesCount ?? null;
    }
    if (targetBookingSales !== undefined) {
      dataToUpdate.targetBookingSales =
        targetBookingSales != null
          ? new Prisma.Decimal(targetBookingSales)
          : null;
    }

    if (updateFields.startDate || updateFields.endDate) {
      const existing = await tx.activityPlan.findUnique({ where: { id } });
      const startDate =
        updateFields.startDate || existing?.startDate || new Date();
      const endDate = updateFields.endDate || existing?.endDate || new Date();

      const fiscal = computeFiscalFields(startDate, endDate);
      dataToUpdate.startDate = startDate;
      dataToUpdate.endDate = endDate;
      dataToUpdate.durationDays = fiscal.durationDays;
      dataToUpdate.fiscalYear = fiscal.fiscalYear;
      dataToUpdate.fiscalMonth = fiscal.fiscalMonth;
      dataToUpdate.fiscalQuarter = fiscal.fiscalQuarter;
    }

    if (
      updateFields.salesPromotionBudgetRequested !== undefined ||
      updateFields.marketingBudgetRequested !== undefined
    ) {
      const existing = await tx.activityPlan.findUnique({ where: { id } });
      const sp =
        updateFields.salesPromotionBudgetRequested !== undefined
          ? updateFields.salesPromotionBudgetRequested
          : existing?.salesPromotionBudgetRequested
            ? Number(existing.salesPromotionBudgetRequested)
            : 0;
      const mkt =
        updateFields.marketingBudgetRequested !== undefined
          ? updateFields.marketingBudgetRequested
          : existing?.marketingBudgetRequested
            ? Number(existing.marketingBudgetRequested)
            : 0;

      dataToUpdate.salesPromotionBudgetRequested = sp
        ? new Prisma.Decimal(sp)
        : null;
      dataToUpdate.marketingBudgetRequested = mkt
        ? new Prisma.Decimal(mkt)
        : null;
      dataToUpdate.totalBudgetRequested = new Prisma.Decimal(
        (sp || 0) + (mkt || 0),
      );
    }

    // 1. Update main record
    const updatedPlan = await tx.activityPlan.update({
      where: { id },
      data: dataToUpdate,
    });

    // 1.1 Sync Work Types
    if (workTypeCodes !== undefined) {
      await tx.activityPlanWorkType.deleteMany({
        where: { activityPlanId: id },
      });
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
            tourType:
              tourData.tourType === "STORE" ? TourType.STORE : TourType.CENTRAL,
            tourSize:
              tourData.tourSize === "LARGE"
                ? TourSize.LARGE
                : tourData.tourSize === "SMALL"
                  ? TourSize.SMALL
                  : null,
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
            targetAmount:
              s.targetAmount != null
                ? new Prisma.Decimal(s.targetAmount)
                : null,
            subDealerStore: s.subDealerStore ?? null,
            remarks: s.remarks ?? null,
            notes: s.notes ?? null,
          })),
        });
      }
    }

    // 1.4 Sync Products
    if (planProducts !== undefined) {
      await tx.activityPlanProduct.deleteMany({
        where: { activityPlanId: id },
      });
      if (planProducts.length > 0) {
        await tx.activityPlanProduct.createMany({
          data: planProducts.map((p) => ({
            activityPlanId: id,
            workTypeCode: getWorkTypeCode(p.workTypeCode),
            storeId: p.storeId ?? null,
            productId: p.productId,
            productName: p.productName ?? null,
            masterPrice:
              p.masterPrice != null ? new Prisma.Decimal(p.masterPrice) : null,
            unitPrice:
              p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null,
            isPriceOverridden: p.isPriceOverridden ?? false,
            targetQuantity: p.targetQuantity ?? null,
            targetAmount:
              p.targetAmount != null
                ? new Prisma.Decimal(p.targetAmount)
                : null,
            notes: p.notes ?? null,
          })),
        });
      }
    }

    // 1.5 Sync Marketing Items
    if (marketingItems !== undefined) {
      await tx.activityPlanMarketingItem.deleteMany({
        where: { activityPlanId: id },
      });
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
      await tx.activityPlanPromotionItem.deleteMany({
        where: { activityPlanId: id },
      });
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
    if (planData.demoPlotData) {
      const existingVisit = await tx.demoPlotVisit.findFirst({
        where: { activityPlanId: id },
        include: { demoPlot: true },
      });

      const plotId = planData.demoPlotData.id || existingVisit?.demoPlotId;

      if (plotId) {
        await tx.demoPlot.update({
          where: { id: plotId },
          data: {
            name: planData.demoPlotData.name,
            ownerName: planData.demoPlotData.ownerName || "",
            customerId: planData.demoPlotData.customerId || null,
            cropCategory: planData.demoPlotData.cropCategory,
            cropName: planData.demoPlotData.cropName,
            customCropName: planData.demoPlotData.customCropName || null,
            areaRai:
              planData.demoPlotData.areaRai != null
                ? new Prisma.Decimal(planData.demoPlotData.areaRai)
                : null,
            treeCount: planData.demoPlotData.treeCount || null,
            location: planData.demoPlotData.location || null,
            province: planData.demoPlotData.province || null,
            district: planData.demoPlotData.district || null,
            objective: planData.demoPlotData.objective || null,
          },
        });

        if (!existingVisit) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId: plotId,
              activityPlanId: id,
              visitDate: updatedPlan.startDate,
            },
          });
        }
      } else {
        const code = await generateDemoPlotCode(
          tx,
          updatedPlan.startDate ? new Date(updatedPlan.startDate) : new Date(),
        );

        const newPlot = await tx.demoPlot.create({
          data: {
            code,
            name: planData.demoPlotData.name,
            ownerName: planData.demoPlotData.ownerName || "",
            customerId: planData.demoPlotData.customerId || null,
            employeeId: updatedPlan.employeeId,
            cropCategory: planData.demoPlotData.cropCategory,
            cropName: planData.demoPlotData.cropName,
            customCropName: planData.demoPlotData.customCropName || null,
            areaRai:
              planData.demoPlotData.areaRai != null
                ? new Prisma.Decimal(planData.demoPlotData.areaRai)
                : null,
            treeCount: planData.demoPlotData.treeCount || null,
            location: planData.demoPlotData.location || null,
            province: planData.demoPlotData.province || null,
            district: planData.demoPlotData.district || null,
            objective: planData.demoPlotData.objective || null,
            startDate: updatedPlan.startDate,
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });

        await tx.demoPlotVisit.deleteMany({ where: { activityPlanId: id } });
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId: newPlot.id,
            activityPlanId: id,
            visitDate: updatedPlan.startDate,
          },
        });
      }
    } else if (
      (demoPlotId !== undefined || demoPlotIds !== undefined) &&
      planData.type7bData === undefined &&
      planData.type7aPlots === undefined &&
      planData.type14Data === undefined
    ) {
      await tx.demoPlotVisit.deleteMany({
        where: {
          activityPlanId: id,
          workTypeCode: { in: ["TYPE_7B", "TYPE_10", "TYPE_14"] },
        },
      });
      const plotIdsToVisit =
        demoPlotIds && demoPlotIds.length > 0
          ? demoPlotIds
          : demoPlotId
            ? [demoPlotId]
            : [];

      if (plotIdsToVisit.length > 0) {
        const currentCodes = workTypeCodes?.map(getWorkTypeCode) ?? [];
        const isType10 = currentCodes.includes("TYPE_10");
        const isType7B = currentCodes.includes("TYPE_7B");
        const isType14 = currentCodes.includes("TYPE_14");
        const visitWorkType = isType10
          ? "TYPE_10"
          : isType7B
            ? "TYPE_7B"
            : isType14
              ? "TYPE_14"
              : currentCodes[0] || null;

        for (const pid of plotIdsToVisit) {
          const existingPlot = await tx.demoPlot.findUnique({
            where: { id: pid },
            select: { id: true },
          });
          if (existingPlot) {
            await tx.demoPlotVisit.create({
              data: {
                demoPlotId: existingPlot.id,
                activityPlanId: id,
                workTypeCode: visitWorkType,
                visitDate: updatedPlan.startDate,
              },
            });
          }
        }
      }
    } else if (planData.demoPlotData === null) {
      await tx.demoPlotVisit.deleteMany({ where: { activityPlanId: id } });
    }

    // 1.8 Sync TYPE_13 Data
    if (planData.type13Data !== undefined || planData.type13Plots !== undefined) {
      const t13Payload: Type13DataInput | null =
        planData.type13Data !== undefined
          ? planData.type13Data
          : planData.type13Plots
            ? {
                plots: planData.type13Plots.map((p, idx) => ({
                  ...p,
                  plotIndex: idx + 1,
                })),
              }
            : null;
      await syncType13Data(
        tx,
        id,
        t13Payload,
        updatedPlan.startDate,
        updatedPlan.employeeId,
      );
    }

    // 1.9 Sync TYPE_14 Data
    if (planData.type14Data !== undefined) {
      await syncType14Data(
        tx,
        id,
        planData.type14Data,
        updatedPlan.startDate,
        updatedPlan.employeeId,
      );
    }

    // 1.9.1 Sync TYPE_7A Plots
    if (planData.type7aPlots !== undefined) {
      await syncType7aPlots(
        tx,
        id,
        planData.type7aPlots,
        updatedPlan.startDate,
        updatedPlan.employeeId,
      );
    }

    // 1.9.2 Sync TYPE_7B Data
    if (planData.type7bData !== undefined) {
      await syncType7bData(
        tx,
        id,
        planData.type7bData,
        updatedPlan.startDate,
      );
    }

    // 3. Sync Helpers if provided
    if (helperEmployeeIds !== undefined) {
      const existingHelpers = await tx.activityHelper.findMany({
        where: { activityPlanId: id },
      });

      const toRemove = existingHelpers.filter(
        (h) =>
          !helperEmployeeIds.includes(h.employeeId) && h.deletedAt === null,
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
              departmentName:
                emp?.departmentName || emp?.department?.name || null,
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

    // Upsert actualData if provided for Unplanned drafts
    if (planData.actualData !== undefined) {
      if (planData.actualData) {
        await upsertActivityResult(
          {
            ...planData.actualData,
            activityPlanId: id,
            recordedById: (planData as any).updatedUserId || undefined,
          },
          tx,
        );
      }
    }

    return updatedPlan;
  });
}

/**
 * Soft delete activity plan, its helpers, and orphan HATTACK demo plots
 */
export async function softDeleteActivityPlan(id: string) {
  return db.$transaction(async (tx) => {
    const now = new Date();

    // 1. Fetch demo plot visits associated with this plan
    const visits = await tx.demoPlotVisit.findMany({
      where: { activityPlanId: id },
      select: { id: true, demoPlotId: true, workTypeCode: true },
    });

    const demoPlotIds = Array.from(new Set(visits.map((v) => v.demoPlotId)));

    // 2. Soft-delete the activity plan
    await tx.activityPlan.update({
      where: { id },
      data: { deletedAt: now },
    });

    // 3. Soft-delete activity helpers
    await tx.activityHelper.updateMany({
      where: { activityPlanId: id, deletedAt: null },
      data: { deletedAt: now },
    });

    // 4. Cancel and soft-delete HATTACK demo plots that have no other active activity plans
    for (const plotId of demoPlotIds) {
      const plot = await tx.demoPlot.findUnique({
        where: { id: plotId },
        select: { id: true, plotType: true, status: true },
      });

      // Only clean up HATTACK plots (GENERAL_DEMO plots are master data assets)
      if (plot && plot.plotType === "HATTACK") {
        const otherActiveVisitsCount = await tx.demoPlotVisit.count({
          where: {
            demoPlotId: plotId,
            activityPlanId: { not: id },
            activityPlan: {
              deletedAt: null,
            },
          },
        });

        if (otherActiveVisitsCount === 0) {
          await tx.demoPlot.update({
            where: { id: plotId },
            data: {
              status: DemoPlotStatus.CANCELLED,
              deletedAt: now,
            },
          });
        }
      }
    }
  });
}



/**
 * Retrieve employee profile by ID
 */
export async function findEmployeeById(id: string) {
  return db.employee.findFirst({
    where: { id, deletedAt: null },
    include: {
      position: true,
      department: true,
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
export async function findOrCreateEmployeeForUser(
  userId: string,
  userName?: string,
  userEmail?: string,
) {
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
  const finalEmail = existingEmail
    ? `emp-${userId.slice(-6)}@crm.local`
    : email;

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
 * Find all active product categories (ProductCategory)
 */
export async function findProductCategories() {
  return db.productCategory.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      description: true,
    },
  });
}
