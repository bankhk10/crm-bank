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
import { createType7aPlots, syncType7aPlots } from "./type-7a.repository";
import { createType7bData, syncType7bData } from "./type-7b.repository";

export * from "./demo-plot.repository";
export * from "./type-7a.repository";
export * from "./type-7b.repository";

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
  type13Plots?: Array<{
    id?: string;
    demoPlotId?: string | null;
    name: string;
    storeId: string;
    ownerName?: string | null;
    province: string;
    district: string;
    products: Array<{
      productId: string;
      productName?: string | null;
      quantity: number;
      unit?: string | null;
    }>;
  }>;
  type14Data?: {
    mode: "EXISTING_PLOT" | "NEW_PLOT";
    demoPlotId?: string | null;
    demoPlotIds?: string[] | null;
    selectedPlotIds?: string[] | null;
    name: string;
    storeId: string;
    ownerName?: string | null;
    province: string;
    district: string;
    latitude: string | number;
    longitude: string | number;
    trackings: Array<{
      id?: string;
      visitDate: Date | string;
      daysSinceStart: number;
      notes?: string | null;
      attachments?: Array<{
        fileUrl: string;
        fileName?: string;
        fileSize?: number | null;
        mimeType?: string | null;
      }>;
    }>;
  };
  type7aPlots?: Array<{
    id?: string;
    demoPlotId?: string | null;
    plotName?: string | null;
    name?: string | null;
    storeId?: string | null;
    ownerName?: string | null;
    farmerName?: string | null;
    farmerPhone?: string | null;
    province?: string | null;
    district?: string | null;
    subdistrict?: string | null;
    latitude?: number | Prisma.Decimal | null;
    longitude?: number | Prisma.Decimal | null;
    cropCategory?: string | null;
    cropName?: string | null;
    customCropName?: string | null;
    areaRai?: number | null;
    treeCount?: number | null;
    plantingDate?: Date | string | null;
    initialSprayDate?: Date | string | null;
    nextSprayDate?: Date | string | null;
    objective?: string | null;
    notes?: string | null;
    categoryId?: string | null;
    products?: Array<{
      productId: string;
      productName?: string | null;
      applicationRate?: string | null;
      quantity?: number | null;
      targetQuantity?: number | null;
      unit?: string | null;
      notes?: string | null;
    }>;
  }>;
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

        // 1.8 TYPE_13 ("ฉีดแปลงแฮตแทค"): Create up to 10 DemoPlots + DemoPlotVisit
        const createdType13PlotMap = new Map<string, string>();
        if (input.type13Plots && input.type13Plots.length > 0) {
          for (let i = 0; i < input.type13Plots.length; i++) {
            const plotItem = input.type13Plots[i];
            const code = await generateDemoPlotCode(
              tx,
              input.startDate ? new Date(input.startDate) : new Date(),
              i,
            );

            const plot = await tx.demoPlot.create({
              data: {
                code,
                name: plotItem.name?.trim() || `แปลงแฮตแทค ${i + 1}`,
                ownerName: plotItem.ownerName || "",
                customerId: plotItem.storeId || null,
                employeeId: input.employeeId,
                province: plotItem.province,
                district: plotItem.district,
                plotType: "HATTACK",
                startDate: input.startDate,
                status: DemoPlotStatus.IN_PROGRESS,
              },
            });

            if (plotItem.id) {
              createdType13PlotMap.set(plotItem.id, plot.id);
            }
            if (plotItem.name) {
              createdType13PlotMap.set(plotItem.name, plot.id);
            }
            createdType13PlotMap.set(`แปลงที่ ${i + 1}`, plot.id);
            createdType13PlotMap.set(`แปลงแฮตแทค ${i + 1}`, plot.id);

            await tx.demoPlotVisit.create({
              data: {
                demoPlotId: plot.id,
                activityPlanId: plan.id,
                workTypeCode: "TYPE_13",
                visitNumber: 1,
                visitDate: input.startDate,
              },
            });

            // Also record in ActivityPlanStore for dealer filtering
            if (plotItem.storeId) {
              await tx.activityPlanStore.create({
                data: {
                  activityPlanId: plan.id,
                  workTypeCode: "TYPE_13",
                  storeId: plotItem.storeId,
                  storeName: plotItem.name,
                  province: plotItem.province,
                },
              });
            }
          }
        }

        // 1.9 TYPE_14 ("ติดตามแปลงแฮทแทค"): DemoPlot + DemoPlotVisit + ActivityAttachment
        if (input.type14Data) {
          const t14 = input.type14Data;
          let targetPlotId = t14.demoPlotId;

          if (t14.mode === "EXISTING_PLOT" && targetPlotId) {
            const hasLat =
              t14.latitude != null &&
              String(t14.latitude).trim() !== "" &&
              !isNaN(Number(t14.latitude));
            const hasLng =
              t14.longitude != null &&
              String(t14.longitude).trim() !== "" &&
              !isNaN(Number(t14.longitude));
            if (hasLat || hasLng) {
              await tx.demoPlot.update({
                where: { id: targetPlotId },
                data: {
                  latitude: hasLat
                    ? new Prisma.Decimal(Number(t14.latitude))
                    : undefined,
                  longitude: hasLng
                    ? new Prisma.Decimal(Number(t14.longitude))
                    : undefined,
                },
              });
            }
          } else {
            const code = await generateDemoPlotCode(
              tx,
              input.startDate ? new Date(input.startDate) : new Date(),
            );

            const newPlot = await tx.demoPlot.create({
              data: {
                code,
                name: t14.name,
                ownerName: t14.ownerName || "",
                customerId: t14.storeId || null,
                employeeId: input.employeeId,
                province: t14.province,
                district: t14.district,
                latitude:
                  t14.latitude != null
                    ? new Prisma.Decimal(Number(t14.latitude))
                    : null,
                longitude:
                  t14.longitude != null
                    ? new Prisma.Decimal(Number(t14.longitude))
                    : null,
                plotType: "HATTACK",
                startDate: input.startDate,
                status: DemoPlotStatus.IN_PROGRESS,
              },
            });
            targetPlotId = newPlot.id;
          }

          if (targetPlotId) {
            if (t14.trackings && t14.trackings.length > 0) {
              for (let tIdx = 0; tIdx < t14.trackings.length; tIdx++) {
                const tracking = t14.trackings[tIdx];
                const visit = await tx.demoPlotVisit.create({
                  data: {
                    demoPlotId: targetPlotId,
                    activityPlanId: plan.id,
                    workTypeCode: "TYPE_14",
                    visitNumber: tIdx + 1,
                    visitDate: new Date(tracking.visitDate),
                    daysSinceStart: Number(tracking.daysSinceStart) || 0,
                    notes: tracking.notes ?? null,
                  },
                });

                if (tracking.attachments && tracking.attachments.length > 0) {
                  await tx.activityAttachment.createMany({
                    data: tracking.attachments.slice(0, 5).map((att) => ({
                      activityPlanId: plan.id,
                      demoPlotId: targetPlotId,
                      demoPlotVisitId: visit.id,
                      workTypeCode: "TYPE_14",
                      category: AttachmentCategory.PLOT,
                      fileUrl: att.fileUrl,
                      fileName: att.fileName || "hattack-result-photo.jpg",
                      fileSize: att.fileSize ?? null,
                      mimeType: att.mimeType ?? null,
                    })),
                  });
                }
              }
            } else {
              // Only create demoPlotVisit if it wasn't already handled by the general demoPlotVisits block above
              const isAlreadyCreated =
                ((input.demoPlotIds && input.demoPlotIds.length > 0) ||
                  input.demoPlotId) &&
                !(input.type13Plots && input.type13Plots.length > 0) &&
                (workTypeCodes.includes("TYPE_14") || primaryCode === "TYPE_14");

              if (!isAlreadyCreated) {
                const plotsToCreate =
                  t14.demoPlotIds && t14.demoPlotIds.length > 0
                    ? t14.demoPlotIds
                    : [targetPlotId];
                for (const pid of plotsToCreate) {
                  const existingPlot = await tx.demoPlot.findUnique({
                    where: { id: pid },
                    select: { id: true },
                  });
                  if (existingPlot) {
                    await tx.demoPlotVisit.create({
                      data: {
                        demoPlotId: existingPlot.id,
                        activityPlanId: plan.id,
                        workTypeCode: "TYPE_14",
                        visitNumber: 1,
                        visitDate: input.startDate,
                        daysSinceStart: 0,
                      },
                    });
                  }
                }
              }
            }
          }
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

    // 1.8 Sync TYPE_13 Plots
    const resolvedType13PlotMap = new Map<string, string>();
    if (planData.type13Plots !== undefined) {
      const existingVisits = await tx.demoPlotVisit.findMany({
        where: { activityPlanId: id, workTypeCode: "TYPE_13" },
        include: { demoPlot: true },
      });
      const existingPlotIds = existingVisits.map((v) => v.demoPlotId);

      await tx.activityPlanProduct.deleteMany({
        where: { activityPlanId: id, workTypeCode: "TYPE_13" },
      });
      await tx.activityPlanStore.deleteMany({
        where: { activityPlanId: id, workTypeCode: "TYPE_13" },
      });

      if (planData.type13Plots && planData.type13Plots.length > 0) {
        for (let i = 0; i < planData.type13Plots.length; i++) {
          const plotItem = planData.type13Plots[i];
          let plotId: string = plotItem.demoPlotId || plotItem.id || "";
          const isRealPlot = Boolean(
            plotId && existingPlotIds.includes(plotId),
          );

          if (isRealPlot) {
            await tx.demoPlot.update({
              where: { id: plotId },
              data: {
                ...(plotItem.name && plotItem.name.trim() !== ""
                  ? { name: plotItem.name.trim() }
                  : {}),
                ownerName: plotItem.ownerName || "",
                customerId: plotItem.storeId || null,
                province: plotItem.province,
                district: plotItem.district,
              },
            });
          } else {
            const code = await generateDemoPlotCode(
              tx,
              updatedPlan.startDate
                ? new Date(updatedPlan.startDate)
                : new Date(),
              i,
            );

            const newPlot = await tx.demoPlot.create({
              data: {
                code,
                name: plotItem.name?.trim() || `แปลงแฮตแทค ${i + 1}`,
                ownerName: plotItem.ownerName || "",
                customerId: plotItem.storeId || null,
                employeeId: updatedPlan.employeeId,
                province: plotItem.province,
                district: plotItem.district,
                plotType: "HATTACK",
                startDate: updatedPlan.startDate,
                status: DemoPlotStatus.IN_PROGRESS,
              },
            });
            plotId = newPlot.id;

            await tx.demoPlotVisit.create({
              data: {
                demoPlotId: plotId,
                activityPlanId: id,
                workTypeCode: "TYPE_13",
                visitNumber: 1,
                visitDate: updatedPlan.startDate,
              },
            });
          }

          if (plotItem.id) {
            resolvedType13PlotMap.set(plotItem.id, plotId);
          }
          if (plotItem.name) {
            resolvedType13PlotMap.set(plotItem.name, plotId);
          }

          // Clean up legacy demoPlotProduct if any exists
          await tx.demoPlotProduct.deleteMany({
            where: { demoPlotId: plotId },
          });

          if (plotItem.storeId) {
            await tx.activityPlanStore.create({
              data: {
                activityPlanId: id,
                workTypeCode: "TYPE_13",
                storeId: plotItem.storeId,
                storeName: plotItem.name,
                province: plotItem.province,
              },
            });
          }
        }
      }
    }

    // 1.9 Sync TYPE_14 Data
    if (planData.type14Data !== undefined) {
      if (planData.type14Data) {
        const t14 = planData.type14Data;
        let targetPlotId = t14.demoPlotId;

        if (t14.mode === "EXISTING_PLOT" && targetPlotId) {
          const hasLat =
            t14.latitude != null &&
            String(t14.latitude).trim() !== "" &&
            !isNaN(Number(t14.latitude));
          const hasLng =
            t14.longitude != null &&
            String(t14.longitude).trim() !== "" &&
            !isNaN(Number(t14.longitude));
          if (hasLat || hasLng) {
            await tx.demoPlot.update({
              where: { id: targetPlotId },
              data: {
                latitude: hasLat
                  ? new Prisma.Decimal(Number(t14.latitude))
                  : undefined,
                longitude: hasLng
                  ? new Prisma.Decimal(Number(t14.longitude))
                  : undefined,
              },
            });
          }
        } else if (!targetPlotId) {
          const code = await generateDemoPlotCode(
            tx,
            updatedPlan.startDate
              ? new Date(updatedPlan.startDate)
              : new Date(),
          );

          const newPlot = await tx.demoPlot.create({
            data: {
              code,
              name: t14.name,
              ownerName: t14.ownerName || "",
              customerId: t14.storeId || null,
              employeeId: updatedPlan.employeeId,
              province: t14.province,
              district: t14.district,
              latitude:
                t14.latitude != null
                  ? new Prisma.Decimal(Number(t14.latitude))
                  : null,
              longitude:
                t14.longitude != null
                  ? new Prisma.Decimal(Number(t14.longitude))
                  : null,
              plotType: "HATTACK",
              startDate: updatedPlan.startDate,
              status: DemoPlotStatus.IN_PROGRESS,
            },
          });
          targetPlotId = newPlot.id;
        }

        const hasTrackings = Boolean(t14.trackings && t14.trackings.length > 0);
        const alreadySyncedInGeneralSection =
          (demoPlotId !== undefined || demoPlotIds !== undefined) && !hasTrackings;

        if (!alreadySyncedInGeneralSection) {
          await tx.demoPlotVisit.deleteMany({
            where: { activityPlanId: id, workTypeCode: "TYPE_14" },
          });

          if (targetPlotId && hasTrackings) {
            for (let tIdx = 0; tIdx < t14.trackings.length; tIdx++) {
              const tracking = t14.trackings[tIdx];
              const visit = await tx.demoPlotVisit.create({
                data: {
                  demoPlotId: targetPlotId,
                  activityPlanId: id,
                  workTypeCode: "TYPE_14",
                  visitNumber: tIdx + 1,
                  visitDate: new Date(tracking.visitDate),
                  daysSinceStart: Number(tracking.daysSinceStart) || 0,
                  notes: tracking.notes ?? null,
                },
              });

              if (tracking.attachments && tracking.attachments.length > 0) {
                await tx.activityAttachment.createMany({
                  data: tracking.attachments.slice(0, 5).map((att) => ({
                    activityPlanId: id,
                    demoPlotId: targetPlotId,
                    demoPlotVisitId: visit.id,
                    workTypeCode: "TYPE_14",
                    category: AttachmentCategory.PLOT,
                    fileUrl: att.fileUrl,
                    fileName: att.fileName || "hattack-result-photo.jpg",
                    fileSize: att.fileSize ?? null,
                    mimeType: att.mimeType ?? null,
                  })),
                });
              }
            }
          } else {
            const plotIdsToSync =
              t14.demoPlotIds && t14.demoPlotIds.length > 0
                ? t14.demoPlotIds
                : targetPlotId
                  ? [targetPlotId]
                  : [];

            for (const pid of plotIdsToSync) {
              const existingPlot = await tx.demoPlot.findUnique({
                where: { id: pid },
                select: { id: true },
              });
              if (existingPlot) {
                await tx.demoPlotVisit.create({
                  data: {
                    demoPlotId: existingPlot.id,
                    activityPlanId: id,
                    workTypeCode: "TYPE_14",
                    visitNumber: 1,
                    visitDate: updatedPlan.startDate,
                    daysSinceStart: 0,
                  },
                });
              }
            }
          }
        }
      }
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
    isAdditional?: boolean;
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
    id?: string;
    storeId: string;
    productId?: string | null;
    competitorBrand: string;
    competitorProduct: string;
    posPrice?: number | null;
    dealerPrice?: number | null;
    subdealerPrice?: number | null;
    farmerPrice?: number | null;
    sellingPoints?: string | null;
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
    applicationRate?: string | null;
  }>;
  sprayRounds?: Array<{
    demoPlotId: string;
    roundNumber: number;
    sprayDate?: string | Date;
    sprayMethod: string;
    sprayEquipment: string;
    otherEquipment?: string | null;
    productResponse: string;
    problemDetail?: string | null;
    daysSinceStart?: number | null;
    notes?: string | null;
    workTypeCode?: string | null;
    products: Array<{
      productId: string;
      productName?: string | null;
      baselineRate?: string | null;
      actualRate: string;
      quantityUsed: number | string;
      unit?: string | null;
      detail?: string | null;
    }>;
    externalProducts?: Array<{
      company: string;
      productName: string;
      activeIngredient?: string | null;
      formula: string;
      customFormula?: string | null;
      applicationRate: string;
    }>;
    attachments?: Array<{
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }>;
  type13PlotsActual?: Array<{
    demoPlotId: string;
    plotName?: string | null;
    storeId?: string | null;
    province?: string | null;
    district?: string | null;
    latitude: number | string | Prisma.Decimal;
    longitude: number | string | Prisma.Decimal;
  }>;
  type13NewPlots?: Array<{
    clientPlotId: string;
    plotName: string;
    storeId?: string | null;
    province?: string | null;
    district?: string | null;
    latitude: number | string | Prisma.Decimal;
    longitude: number | string | Prisma.Decimal;
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
  issueResults?: Array<{
    id?: string;
    productId?: string | null;
    productName?: string | null;
    lotNumber?: string | null;
    purchaseChannel: string;
    storeId?: string | null;
    storeName?: string | null;
    issueType: string;
    detail?: string | null;
    status?: string;
  }>;
  type7aDemoPlot?: {
    customerId?: string | null;
    farmerCustomerId?: string | null;
    ownerName: string;
    ownerPhone?: string | null;
    ownerProvince?: string | null;
    ownerDistrict?: string | null;
    isUnregisteredFarmer: boolean;
    province: string;
    district?: string | null;
    latitude: number;
    longitude: number;
    plotName: string;
    dealerName?: string | null;
    cropCategory: string;
    cropName: string;
    customCropName?: string | null;
    areaRai?: number | null;
    treeCount?: number | null;
    objective?: string | null;
    experimentDetail?: string | null;
    mainCropInfo?: string | null;
    plantingDate?: Date | null;
    initialSprayDate?: Date | null;
    nextSprayDate?: Date | null;
    sprayMethod: string;
    hasExternalChemicals: boolean;
    demoProducts: Array<{
      productId: string;
      productName?: string | null;
      quantity: number;
      remainingQuantity?: number | null;
      unit?: string | null;
      applicationRate: string;
    }>;
    externalProducts?: Array<{
      company: string;
      productName: string;
      activeIngredient?: string | null;
      formula: string;
      customFormula?: string | null;
      applicationRate: string;
    }>;
    irrigations?: string[];
    usageMethod?: string | null;
    notes?: string | null;
    cropAgeValue?: number | null;
    cropAgeUnit?: string | null;
    growthStage?: string | null;
    cropCondition?: string | null;
    productResponse?: string | null;
    sprayEquipment?: string | null;
    otherEquipment?: string | null;
  } | null;
  attachments?: Array<{
    workTypeCode?: string | null;
    storeId?: string | null;
    productId?: string | null;
    surveyItemId?: string | null;
    issueItemId?: string | null;
    demoPlotId?: string | null;
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
    // Check if result already exists before upsert to detect create vs edit and status change
    const existingResult = await tx.activityResult.findUnique({
      where: { activityPlanId: input.activityPlanId },
      select: { id: true, resultStatus: true },
    });

    const isFirstTime = !existingResult;
    const oldStatus = existingResult?.resultStatus ?? null;
    const newStatus = input.resultStatus ?? ActivityResultStatus.COMPLETED;
    const isStatusChanged = !isFirstTime && oldStatus !== newStatus;

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
        plotLatitude:
          input.plotLatitude != null
            ? new Prisma.Decimal(input.plotLatitude)
            : null,
        plotLongitude:
          input.plotLongitude != null
            ? new Prisma.Decimal(input.plotLongitude)
            : null,
        cancelReason: input.cancelReason ?? null,
        postponedDate: input.postponedDate ?? null,
        postponedTime: input.postponedTime ?? null,
        postponedReason: input.postponedReason ?? null,
        postponedNotes: input.postponedNotes ?? null,
        actualSalesPromotionSpent: input.actualSalesPromotionSpent
          ? new Prisma.Decimal(input.actualSalesPromotionSpent)
          : null,
        actualMarketingSpent: input.actualMarketingSpent
          ? new Prisma.Decimal(input.actualMarketingSpent)
          : null,
        actualTotalSpent: new Prisma.Decimal(actualTotalSpent),
        salesResultAmount: input.salesResultAmount
          ? new Prisma.Decimal(input.salesResultAmount)
          : null,
        salesOrdersCount: input.salesOrdersCount ?? null,
        collectResultAmount: input.collectResultAmount
          ? new Prisma.Decimal(input.collectResultAmount)
          : null,
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
        plotLatitude:
          input.plotLatitude != null
            ? new Prisma.Decimal(input.plotLatitude)
            : null,
        plotLongitude:
          input.plotLongitude != null
            ? new Prisma.Decimal(input.plotLongitude)
            : null,
        cancelReason: input.cancelReason ?? null,
        postponedDate: input.postponedDate ?? null,
        postponedTime: input.postponedTime ?? null,
        postponedReason: input.postponedReason ?? null,
        postponedNotes: input.postponedNotes ?? null,
        actualSalesPromotionSpent: input.actualSalesPromotionSpent
          ? new Prisma.Decimal(input.actualSalesPromotionSpent)
          : null,
        actualMarketingSpent: input.actualMarketingSpent
          ? new Prisma.Decimal(input.actualMarketingSpent)
          : null,
        actualTotalSpent: new Prisma.Decimal(actualTotalSpent),
        salesResultAmount: input.salesResultAmount
          ? new Prisma.Decimal(input.salesResultAmount)
          : null,
        salesOrdersCount: input.salesOrdersCount ?? null,
        collectResultAmount: input.collectResultAmount
          ? new Prisma.Decimal(input.collectResultAmount)
          : null,
        demoPlotsCreated: input.demoPlotsCreated ?? null,
        demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
        distributorsCount: input.distributorsCount ?? null,
        farmersCount: input.farmersCount ?? null,
        recordedById: input.recordedById ?? null,
      },
    });

    // 1. Sync Sale Results
    if (input.saleResults !== undefined) {
      await tx.activityResultSaleItem.deleteMany({
        where: { activityResultId: result.id },
      });
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
            isAdditional: Boolean(item.isAdditional),
          })),
        });
      }
    }

    // 2. Sync Stock Results
    if (input.stockResults !== undefined) {
      await tx.activityResultStockItem.deleteMany({
        where: { activityResultId: result.id },
      });
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
      await tx.activityResultSurveyItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.surveyResults.length > 0) {
        await tx.activityResultSurveyItem.createMany({
          data: input.surveyResults.map((item) => ({
            id: item.id || undefined,
            activityResultId: result.id,
            storeId: item.storeId,
            productId: item.productId ?? null,
            competitorBrand: item.competitorBrand,
            competitorProduct: item.competitorProduct,
            posPrice:
              item.posPrice != null ? new Prisma.Decimal(item.posPrice) : null,
            dealerPrice:
              item.dealerPrice != null
                ? new Prisma.Decimal(item.dealerPrice)
                : null,
            subdealerPrice:
              item.subdealerPrice != null
                ? new Prisma.Decimal(item.subdealerPrice)
                : null,
            farmerPrice:
              item.farmerPrice != null
                ? new Prisma.Decimal(item.farmerPrice)
                : null,
            sellingPoints: item.sellingPoints ?? null,
            competitorPrice:
              item.competitorPrice != null
                ? new Prisma.Decimal(item.competitorPrice)
                : null,
            competitorUnit: item.competitorUnit ?? null,
            promotionDetail: item.promotionDetail ?? null,
          })),
        });
      }
    }

    // 4. Sync Demo Results
    if (input.demoResults !== undefined) {
      await tx.activityResultDemoItem.deleteMany({
        where: { activityResultId: result.id },
      });
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
            finalYieldKg:
              item.finalYieldKg != null
                ? new Prisma.Decimal(item.finalYieldKg)
                : null,
            controlYieldKg:
              item.controlYieldKg != null
                ? new Prisma.Decimal(item.controlYieldKg)
                : null,
            satisfactionScore: item.satisfactionScore ?? null,
            applicationRate: item.applicationRate ?? null,
          })),
        });
      }
    }

    // 5. Sync Followup Results
    if (input.followupResults !== undefined) {
      await tx.activityResultFollowupItem.deleteMany({
        where: { activityResultId: result.id },
      });
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

    // 6. Sync Issue Results (TYPE_6)
    const clientIssueMap = new Map<string, string>();
    if (input.issueResults !== undefined) {
      await tx.activityResultIssueItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.issueResults.length > 0) {
        const issueItemsToCreate = input.issueResults.map((item) => {
          const dbId = randomUUID();
          if (item.id) {
            clientIssueMap.set(item.id, dbId);
          }
          return {
            id: dbId,
            activityResultId: result.id,
            productId: item.productId ?? null,
            productName: item.productName ?? null,
            lotNumber: item.lotNumber ?? null,
            purchaseChannel: item.purchaseChannel,
            storeId: item.storeId ?? null,
            storeName: item.storeName ?? null,
            issueType: item.issueType,
            detail: item.detail ?? null,
            status: item.status || "เสร็จสิ้น",
          };
        });

        await tx.activityResultIssueItem.createMany({
          data: issueItemsToCreate,
        });
      }
    }

    // 6.1. Process TYPE_13 Plots (Existing Update & New On-the-fly Discovery)
    const clientPlotMap = new Map<string, string>();

    // 6.1.1. Validate and Create New TYPE_13 Plots discovered on-the-fly
    if (input.type13NewPlots && input.type13NewPlots.length > 0) {
      // Validate uniqueness of clientPlotId
      const seenClientPlotIds = new Set<string>();
      for (const newPlotItem of input.type13NewPlots) {
        if (!newPlotItem.clientPlotId) {
          throw new Error("TYPE_13 new plot missing clientPlotId");
        }
        if (seenClientPlotIds.has(newPlotItem.clientPlotId)) {
          throw new Error(
            `Duplicate clientPlotId: ${newPlotItem.clientPlotId}`,
          );
        }
        seenClientPlotIds.add(newPlotItem.clientPlotId);

        // Latitude & Longitude validation
        const latNum = Number(newPlotItem.latitude);
        const lngNum = Number(newPlotItem.longitude);
        if (
          newPlotItem.latitude == null ||
          newPlotItem.longitude == null ||
          newPlotItem.latitude === "" ||
          newPlotItem.longitude === "" ||
          isNaN(latNum) ||
          isNaN(lngNum)
        ) {
          throw new Error(
            `New plot "${newPlotItem.plotName || newPlotItem.clientPlotId}" has invalid or missing coordinates`,
          );
        }
      }

      // Fetch activity plan for employeeId and startDate
      const plan = await tx.activityPlan.findUnique({
        where: { id: input.activityPlanId },
        select: {
          employeeId: true,
          startDate: true,
        },
      });

      for (let i = 0; i < input.type13NewPlots.length; i++) {
        const item = input.type13NewPlots[i];
        const code = await generateDemoPlotCode(
          tx,
          plan?.startDate ? new Date(plan.startDate) : new Date(),
          0,
        );

        const createdPlot = await tx.demoPlot.create({
          data: {
            code,
            name:
              item.plotName && item.plotName.trim()
                ? item.plotName.trim()
                : "แปลงแฮตแทค",
            ownerName: "",
            customerId:
              item.storeId && item.storeId.trim() ? item.storeId.trim() : null,
            employeeId: plan?.employeeId || "emp-system",
            province:
              item.province && item.province.trim()
                ? item.province.trim()
                : null,
            district:
              item.district && item.district.trim()
                ? item.district.trim()
                : null,
            plotType: "HATTACK",
            startDate: plan?.startDate || input.actualStartDate || new Date(),
            latitude: new Prisma.Decimal(item.latitude),
            longitude: new Prisma.Decimal(item.longitude),
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });

        // DemoPlotVisit creation for new plot
        const existingVisit = await tx.demoPlotVisit.findFirst({
          where: {
            demoPlotId: createdPlot.id,
            activityPlanId: input.activityPlanId,
          },
        });
        if (!existingVisit) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId: createdPlot.id,
              activityPlanId: input.activityPlanId,
              workTypeCode: "TYPE_13",
              visitNumber: 1,
              visitDate: input.actualStartDate || plan?.startDate || new Date(),
            },
          });
        }

        clientPlotMap.set(item.clientPlotId, createdPlot.id);
      }
    }

    // 6.1.2. Update Existing TYPE_13 Plots GPS coordinates & Plot Name & Dealer
    if (input.type13PlotsActual && input.type13PlotsActual.length > 0) {
      for (const plotItem of input.type13PlotsActual) {
        if (plotItem.demoPlotId) {
          const updateData: any = {};
          if (
            plotItem.latitude != null &&
            plotItem.latitude !== "" &&
            plotItem.longitude != null &&
            plotItem.longitude !== ""
          ) {
            updateData.latitude = new Prisma.Decimal(plotItem.latitude);
            updateData.longitude = new Prisma.Decimal(plotItem.longitude);
          }
          if (plotItem.plotName && plotItem.plotName.trim() !== "") {
            updateData.name = plotItem.plotName.trim();
          }
          if (plotItem.storeId && plotItem.storeId.trim() !== "") {
            updateData.customerId = plotItem.storeId.trim();
          }
          if (plotItem.province && plotItem.province.trim() !== "") {
            updateData.province = plotItem.province.trim();
          }
          if (plotItem.district && plotItem.district.trim() !== "") {
            updateData.district = plotItem.district.trim();
          }
          if (Object.keys(updateData).length > 0) {
            await tx.demoPlot.update({
              where: { id: plotItem.demoPlotId },
              data: updateData,
            });
          }
        }
      }
    }

    // 6.2. Sync Spraying Rounds (TYPE_7B / TYPE_13)
    if (input.sprayRounds !== undefined) {
      await tx.activityResultSprayRound.deleteMany({
        where: { activityResultId: result.id },
      });
      if (input.sprayRounds.length > 0) {
        for (const round of input.sprayRounds) {
          let targetPlotId = round.demoPlotId || (round as any).clientPlotId;
          if (targetPlotId && clientPlotMap.has(targetPlotId)) {
            targetPlotId = clientPlotMap.get(targetPlotId)!;
          } else if (
            targetPlotId &&
            (targetPlotId.startsWith("temp-") ||
              targetPlotId.startsWith("client-"))
          ) {
            throw new Error(
              `Unable to resolve TYPE_13 client plot ID: ${targetPlotId}`,
            );
          }

          if (!targetPlotId || !targetPlotId.trim()) {
            const planRel = await tx.activityPlan.findUnique({
              where: { id: input.activityPlanId },
              select: {
                demoPlotVisits: { select: { demoPlotId: true }, take: 1 },
                type7b: {
                  select: { plots: { select: { demoPlotId: true }, take: 1 } },
                },
              },
            });
            targetPlotId =
              planRel?.demoPlotVisits?.[0]?.demoPlotId ||
              planRel?.type7b?.plots?.[0]?.demoPlotId ||
              "";
          }

          if (!targetPlotId || !targetPlotId.trim()) {
            throw new Error("Spray round is missing demoPlotId");
          }

          const createdRound = await tx.activityResultSprayRound.create({
            data: {
              activityResultId: result.id,
              demoPlotId: targetPlotId,
              roundNumber: round.roundNumber,
              sprayDate: round.sprayDate
                ? new Date(round.sprayDate)
                : new Date(),
              sprayMethod: round.sprayMethod || "FOLLOW_UP",
              sprayEquipment: round.sprayEquipment || "FOLLOW_UP",
              otherEquipment: round.otherEquipment ?? null,
              productResponse: round.productResponse,
              problemDetail: round.problemDetail ?? null,
              daysSinceStart:
                round.daysSinceStart != null
                  ? Number(round.daysSinceStart)
                  : null,
              notes: round.notes ?? null,
              workTypeCode: round.workTypeCode ?? null,
              products: {
                create: (round.products || []).map((p: any) => ({
                  productId: p.productId,
                  productName: p.productName ?? null,
                  baselineRate: p.baselineRate ?? null,
                  actualRate: p.actualRate,
                  quantityUsed: new Prisma.Decimal(Number(p.quantityUsed) || 0),
                  unit: p.unit ?? null,
                  detail: p.detail ?? null,
                })),
              },
              externalProducts: {
                create: (round.externalProducts || []).map((ep: any) => ({
                  company: ep.company,
                  productName: ep.productName,
                  activeIngredient: ep.activeIngredient ?? null,
                  formula: ep.formula,
                  customFormula: ep.customFormula ?? null,
                  applicationRate: ep.applicationRate,
                })),
              },
            },
          });

          // Update or create DemoPlotVisit for TYPE_14 (per round)
          if (round.workTypeCode === "TYPE_14") {
            const existingVisit = await tx.demoPlotVisit.findFirst({
              where: {
                activityPlanId: input.activityPlanId,
                demoPlotId: targetPlotId,
                visitNumber: round.roundNumber || 1,
              },
            });
            if (existingVisit) {
              await tx.demoPlotVisit.update({
                where: { id: existingVisit.id },
                data: {
                  workTypeCode: "TYPE_14",
                  visitDate: round.sprayDate
                    ? new Date(round.sprayDate)
                    : new Date(),
                  daysSinceStart:
                    round.daysSinceStart != null
                      ? Number(round.daysSinceStart)
                      : (existingVisit.daysSinceStart ?? 0),
                  productResponse: round.productResponse ?? null,
                  notes: round.notes ?? null,
                },
              });
            } else {
              await tx.demoPlotVisit.create({
                data: {
                  activityPlanId: input.activityPlanId,
                  demoPlotId: targetPlotId,
                  workTypeCode: "TYPE_14",
                  visitNumber: round.roundNumber || 1,
                  visitDate: round.sprayDate
                    ? new Date(round.sprayDate)
                    : new Date(),
                  daysSinceStart:
                    round.daysSinceStart != null
                      ? Number(round.daysSinceStart)
                      : 0,
                  productResponse: round.productResponse ?? null,
                  notes: round.notes ?? null,
                },
              });
            }
          }

          // Link attachments for this spraying round if any
          if (round.attachments && round.attachments.length > 0) {
            await tx.activityAttachment.createMany({
              data: round.attachments.map((att: any) => ({
                activityPlanId: input.activityPlanId,
                activityResultId: result.id,
                workTypeCode: round.workTypeCode || "TYPE_7B",
                demoPlotId: targetPlotId,
                sprayRoundId: createdRound.id,
                category: AttachmentCategory.PLOT,
                fileUrl: att.fileUrl,
                fileName: att.fileName || "spray-round-photo.jpg",
                fileSize: att.fileSize ?? null,
                mimeType: att.mimeType ?? null,
              })),
            });
          }
        }
      }
    }

    // 6.5. Sync TYPE_7A Demo Plot Initial Data (Rule 11: Persistence Architecture)
    let createdDemoPlotId: string | null = null;
    if (input.type7aDemoPlot) {
      const demoData = input.type7aDemoPlot;
      const plan = await tx.activityPlan.findUnique({
        where: { id: input.activityPlanId },
        select: {
          employeeId: true,
          stores: { select: { storeId: true } },
          demoPlotVisits: {
            where: { visitNumber: 1 },
            include: { demoPlot: true },
            take: 1,
          },
        },
      });

      let existingPlot = plan?.demoPlotVisits?.[0]?.demoPlot || null;
      if (!existingPlot) {
        const earliestVisit = await tx.demoPlotVisit.findFirst({
          where: { activityPlanId: input.activityPlanId },
          orderBy: [{ visitNumber: "asc" }, { createdAt: "asc" }],
          include: { demoPlot: true },
        });
        existingPlot = earliestVisit?.demoPlot || null;
      }
      if (!existingPlot) {
        existingPlot = await tx.demoPlot.findFirst({
          where: {
            OR: [
              { visits: { some: { activityPlanId: input.activityPlanId } } },
              {
                name: demoData.plotName,
                ownerName: demoData.ownerName,
                deletedAt: null,
              },
            ],
          },
        });
      }

      let plotId: string;
      const validDemoProducts = (demoData.demoProducts || []).filter(
        (p) =>
          p.productId &&
          p.productId.trim() &&
          p.productId !== "prod-default",
      );
      const primaryProduct = validDemoProducts[0];
      if (existingPlot) {
        plotId = existingPlot.id;

        // Guards: Do not overwrite existing plot data with empty, null, or undefined values from actualData
        const resolvedCropCategory =
          demoData.cropCategory &&
          demoData.cropCategory.trim() !== "" &&
          demoData.cropCategory !== "พืชทั่วไป"
            ? demoData.cropCategory.trim()
            : existingPlot.cropCategory || null;

        const resolvedCropName =
          demoData.cropName &&
          demoData.cropName.trim() !== "" &&
          demoData.cropName !== "พืชทั่วไป"
            ? demoData.cropName.trim()
            : existingPlot.cropName || null;

        const resolvedCustomCropName =
          demoData.customCropName && demoData.customCropName.trim() !== ""
            ? demoData.customCropName.trim()
            : existingPlot.customCropName ?? null;

        let resolvedAreaRai = existingPlot.areaRai ?? null;
        if (demoData.areaRai != null && (typeof demoData.areaRai !== "string" || demoData.areaRai !== "")) {
          const num = Number(demoData.areaRai);
          if (!isNaN(num) && num > 0) {
            resolvedAreaRai = new Prisma.Decimal(num);
          } else if (existingPlot.areaRai == null && !isNaN(num)) {
            resolvedAreaRai = new Prisma.Decimal(num);
          }
        }

        let resolvedTreeCount = existingPlot.treeCount ?? null;
        if (demoData.treeCount != null && (typeof demoData.treeCount !== "string" || demoData.treeCount !== "")) {
          const num = Number(demoData.treeCount);
          if (!isNaN(num) && num > 0) {
            resolvedTreeCount = num;
          } else if (existingPlot.treeCount == null && !isNaN(num)) {
            resolvedTreeCount = num;
          }
        }

        const resolvedPlotName =
          demoData.plotName && demoData.plotName.trim() !== ""
            ? demoData.plotName.trim()
            : existingPlot.name;

        const resolvedOwnerName =
          demoData.ownerName && demoData.ownerName.trim() !== ""
            ? demoData.ownerName.trim()
            : existingPlot.ownerName;

        const resolvedProvince =
          demoData.province && demoData.province.trim() !== ""
            ? demoData.province.trim()
            : existingPlot.province;

        const resolvedDistrict =
          demoData.district && demoData.district.trim() !== ""
            ? demoData.district.trim()
            : existingPlot.district ?? null;

        const resolvedObjective =
          demoData.objective && demoData.objective.trim() !== ""
            ? demoData.objective.trim()
            : existingPlot.objective || null;

        const resolvedExperimentDetail =
          demoData.experimentDetail && demoData.experimentDetail.trim() !== ""
            ? demoData.experimentDetail.trim()
            : existingPlot.experimentDetail || null;

        await tx.demoPlot.update({
          where: { id: plotId },
          data: {
            name: resolvedPlotName,
            ownerName: resolvedOwnerName,
            ownerPhone: demoData.ownerPhone ?? existingPlot.ownerPhone ?? null,
            ownerProvince: demoData.ownerProvince ?? existingPlot.ownerProvince ?? null,
            ownerDistrict: demoData.ownerDistrict ?? existingPlot.ownerDistrict ?? null,
            isUnregisteredFarmer: demoData.isUnregisteredFarmer ?? existingPlot.isUnregisteredFarmer,
            farmerCustomerId: demoData.farmerCustomerId ?? existingPlot.farmerCustomerId ?? null,
            province: resolvedProvince,
            district: resolvedDistrict,
            latitude:
              demoData.latitude != null && !isNaN(Number(demoData.latitude)) && Number(demoData.latitude) !== 0
                ? new Prisma.Decimal(demoData.latitude)
                : existingPlot.latitude ?? new Prisma.Decimal(demoData.latitude ?? 0),
            longitude:
              demoData.longitude != null && !isNaN(Number(demoData.longitude)) && Number(demoData.longitude) !== 0
                ? new Prisma.Decimal(demoData.longitude)
                : existingPlot.longitude ?? new Prisma.Decimal(demoData.longitude ?? 0),
            cropCategory: resolvedCropCategory,
            cropName: resolvedCropName,
            customCropName: resolvedCustomCropName,
            areaRai: resolvedAreaRai,
            treeCount: resolvedTreeCount,
            objective: resolvedObjective,
            experimentDetail: resolvedExperimentDetail,
            mainCropInfo: demoData.mainCropInfo ?? existingPlot.mainCropInfo ?? null,
            plantingDate: demoData.plantingDate ?? existingPlot.plantingDate ?? null,
            initialSprayDate: demoData.initialSprayDate ?? existingPlot.initialSprayDate ?? null,
            nextSprayDate: demoData.nextSprayDate ?? existingPlot.nextSprayDate ?? null,
            sprayMethod: demoData.sprayMethod ?? existingPlot.sprayMethod,
            hasExternalChemicals: demoData.hasExternalChemicals ?? existingPlot.hasExternalChemicals,
            usageMethod: demoData.usageMethod ?? existingPlot.usageMethod ?? null,
            notes: demoData.notes ?? existingPlot.notes ?? null,
            primaryProductName: primaryProduct?.productName || existingPlot.primaryProductName || null,
            primaryProductId: primaryProduct?.productId || existingPlot.primaryProductId || null,
          },
        });
      } else {
        const code = await generateDemoPlotCode(
          tx,
          demoData.initialSprayDate
            ? new Date(demoData.initialSprayDate)
            : demoData.plantingDate
              ? new Date(demoData.plantingDate)
              : new Date(),
        );

        const newPlot = await tx.demoPlot.create({
          data: {
            code,
            name: demoData.plotName,
            ownerName: demoData.ownerName,
            ownerPhone: demoData.ownerPhone ?? null,
            ownerProvince: demoData.ownerProvince ?? null,
            ownerDistrict: demoData.ownerDistrict ?? null,
            isUnregisteredFarmer: demoData.isUnregisteredFarmer,
            customerId:
              demoData.customerId || plan?.stores?.[0]?.storeId || null,
            farmerCustomerId: demoData.farmerCustomerId ?? null,
            employeeId: plan?.employeeId || "emp-system",
            province: demoData.province,
            district: demoData.district ?? null,
            latitude: new Prisma.Decimal(demoData.latitude),
            longitude: new Prisma.Decimal(demoData.longitude),
            cropCategory: demoData.cropCategory,
            cropName: demoData.cropName,
            customCropName: demoData.customCropName ?? null,
            areaRai:
              demoData.areaRai != null
                ? new Prisma.Decimal(demoData.areaRai)
                : null,
            treeCount: demoData.treeCount ?? null,
            objective: demoData.objective ?? null,
            experimentDetail: demoData.experimentDetail ?? null,
            mainCropInfo: demoData.mainCropInfo ?? null,
            startDate:
              demoData.initialSprayDate || demoData.plantingDate || new Date(),
            plantingDate: demoData.plantingDate ?? null,
            initialSprayDate: demoData.initialSprayDate ?? null,
            nextSprayDate: demoData.nextSprayDate ?? null,
            sprayMethod: demoData.sprayMethod,
            hasExternalChemicals: demoData.hasExternalChemicals,
            usageMethod: demoData.usageMethod ?? null,
            notes: demoData.notes ?? null,
            primaryProductName: primaryProduct?.productName || null,
            primaryProductId: primaryProduct?.productId || null,
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });
        plotId = newPlot.id;
      }
      createdDemoPlotId = plotId;

      // Save DemoPlotProduct (Single Source of Truth for applicationRate)
      await tx.demoPlotProduct.deleteMany({ where: { demoPlotId: plotId } });
      if (validDemoProducts.length > 0) {
        await tx.demoPlotProduct.createMany({
          data: validDemoProducts.map((p, idx) => ({
            demoPlotId: plotId,
            productId: p.productId,
            productName: p.productName ?? null,
            quantity: new Prisma.Decimal(p.quantity),
            remainingQuantity:
              p.remainingQuantity != null
                ? new Prisma.Decimal(p.remainingQuantity)
                : null,
            unit: p.unit ?? null,
            applicationRate: p.applicationRate,
            sortOrder: idx,
          })),
        });
      }

      // Save DemoPlotExternalProduct
      await tx.demoPlotExternalProduct.deleteMany({
        where: { demoPlotId: plotId },
      });
      if (
        demoData.sprayMethod === "TANK_MIXED" &&
        demoData.hasExternalChemicals &&
        demoData.externalProducts &&
        demoData.externalProducts.length > 0
      ) {
        await tx.demoPlotExternalProduct.createMany({
          data: demoData.externalProducts.slice(0, 4).map((ep, idx) => ({
            demoPlotId: plotId,
            company: ep.company,
            productName: ep.productName,
            activeIngredient: ep.activeIngredient ?? null,
            formula: ep.formula,
            customFormula:
              ep.formula === "อื่นๆ" ? (ep.customFormula ?? null) : null,
            applicationRate: ep.applicationRate,
            sortOrder: idx,
          })),
        });
      }

      // Save DemoPlotIrrigation (1:N normalized)
      await tx.demoPlotIrrigation.deleteMany({ where: { demoPlotId: plotId } });
      if (demoData.irrigations && demoData.irrigations.length > 0) {
        const uniqueMethods = Array.from(new Set(demoData.irrigations));
        await tx.demoPlotIrrigation.createMany({
          data: uniqueMethods.map((m) => ({
            demoPlotId: plotId,
            method: m,
          })),
        });
      }

      // Create / Update DemoPlotVisit #1
      const existingVisit1 = await tx.demoPlotVisit.findFirst({
        where: {
          demoPlotId: plotId,
          activityPlanId: input.activityPlanId,
        },
      });

      const visitDate =
        demoData.initialSprayDate ||
        demoData.plantingDate ||
        input.actualStartDate ||
        new Date();
      if (existingVisit1) {
        await tx.demoPlotVisit.update({
          where: { id: existingVisit1.id },
          data: {
            visitDate,
            cropAgeValue: demoData.cropAgeValue ?? null,
            cropAgeUnit: demoData.cropAgeUnit || "วัน",
            growthStage: demoData.growthStage ?? null,
            cropCondition: demoData.cropCondition ?? null,
            productResponse: demoData.productResponse ?? null,
            usageMethod: demoData.usageMethod ?? null,
            notes: demoData.notes ?? null,
            sprayMethod: demoData.sprayMethod ?? null,
            sprayEquipment: demoData.sprayEquipment ?? null,
            otherEquipment: demoData.otherEquipment ?? null,
          },
        });
      } else {
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId: plotId,
            activityPlanId: input.activityPlanId,
            visitNumber: 1,
            visitDate,
            daysSinceStart: 0,
            cropAgeValue: demoData.cropAgeValue ?? null,
            cropAgeUnit: demoData.cropAgeUnit || "วัน",
            growthStage: demoData.growthStage ?? null,
            cropCondition: demoData.cropCondition ?? null,
            productResponse: demoData.productResponse ?? null,
            usageMethod: demoData.usageMethod ?? null,
            notes: demoData.notes ?? null,
            sprayMethod: demoData.sprayMethod ?? null,
            sprayEquipment: demoData.sprayEquipment ?? null,
            otherEquipment: demoData.otherEquipment ?? null,
          },
        });
      }
    }

    // 7. Sync Attachments
    if (input.attachments !== undefined) {
      await tx.activityAttachment.deleteMany({
        where: {
          activityResultId: result.id,
          sprayRoundId: null,
        },
      });
      if (input.attachments.length > 0) {
        const existingSurveyItems = await tx.activityResultSurveyItem.findMany({
          where: { activityResultId: result.id },
          select: { id: true },
        });
        const validSurveyItemIds = new Set(
          existingSurveyItems.map((s) => s.id),
        );

        const existingIssueItems = await tx.activityResultIssueItem.findMany({
          where: { activityResultId: result.id },
          select: { id: true },
        });
        const validIssueItemIds = new Set(existingIssueItems.map((s) => s.id));

        await tx.activityAttachment.createMany({
          data: input.attachments.map((att) => ({
            activityPlanId: input.activityPlanId,
            activityResultId: result.id,
            workTypeCode: att.workTypeCode
              ? getWorkTypeCode(att.workTypeCode)
              : null,
            storeId: att.storeId ?? null,
            productId: att.productId ?? null,
            surveyItemId:
              att.surveyItemId && validSurveyItemIds.has(att.surveyItemId)
                ? att.surveyItemId
                : null,
            issueItemId: (() => {
              let issueId = att.issueItemId;
              if (issueId && clientIssueMap.has(issueId)) {
                issueId = clientIssueMap.get(issueId);
              }
              return issueId && validIssueItemIds.has(issueId)
                ? issueId
                : null;
            })(),
            demoPlotId: (() => {
              let plotId = att.demoPlotId || (att as any).clientPlotId;
              if (plotId && clientPlotMap.has(plotId)) {
                plotId = clientPlotMap.get(plotId);
              } else if (
                plotId &&
                (plotId.startsWith("temp-") || plotId.startsWith("client-"))
              ) {
                throw new Error(
                  `Unable to resolve attachment client plot ID: ${plotId}`,
                );
              }
              return (
                plotId ||
                (att.workTypeCode === "TYPE_7A" ||
                att.workTypeCode === "ทำแปลงสาธิต"
                  ? createdDemoPlotId
                  : null)
              );
            })(),
            category: att.category ?? AttachmentCategory.GENERAL,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileSize: att.fileSize ?? null,
            mimeType: att.mimeType ?? null,
          })),
        });
      }
    }

    // Audit Logging in the same transaction
    const actorUserId = input.recordedById;
    if (actorUserId) {
      if (isFirstTime) {
        // 6 & 10. First time recording: RECORD_ACTUAL
        await tx.activityResultLog.create({
          data: {
            activityResultId: result.id,
            userId: actorUserId,
            action: ActivityResultAction.RECORD_ACTUAL,
            previousStatus: null,
            newStatus: result.resultStatus,
            comment: "บันทึกผลการทำกิจกรรม",
          },
        });
      } else {
        // 7 & 9. Editing existing: UPDATE_ACTUAL
        await tx.activityResultLog.create({
          data: {
            activityResultId: result.id,
            userId: actorUserId,
            action: ActivityResultAction.UPDATE_ACTUAL,
            previousStatus: oldStatus,
            newStatus: result.resultStatus,
            comment: "แก้ไขผลการทำกิจกรรม",
          },
        });

        // 8. If status changed: additionally create CHANGE_ACTUAL_STATUS
        if (isStatusChanged) {
          await tx.activityResultLog.create({
            data: {
              activityResultId: result.id,
              userId: actorUserId,
              action: ActivityResultAction.CHANGE_ACTUAL_STATUS,
              previousStatus: oldStatus,
              newStatus: result.resultStatus,
              comment: "เปลี่ยนสถานะผลการทำกิจกรรม",
            },
          });
        }
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
      demoProducts: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      externalProducts: {
        orderBy: { sortOrder: "asc" },
      },
      irrigations: true,
      attachments: true,
      sprayRounds: {
        include: {
          products: {
            include: {
              product: {
                select: { id: true, name: true, productCode: true, unit: true },
              },
            },
          },
          externalProducts: true,
          attachments: true,
        },
        orderBy: { roundNumber: "asc" as const },
      },
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
    code = await generateDemoPlotCode(
      db,
      data.startDate ? new Date(data.startDate) : new Date(),
    );
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
  daysSinceStart?: number | null;
  cropAgeValue?: number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  cropProblemDesc?: string | null;
  productResponse?: string | null;
  productProblemDesc?: string | null;
  usageMethod?: string | null;
  sprayMethod?: string | null;
  sprayEquipment?: string | null;
  otherEquipment?: string | null;
  externalProducts?: Array<{
    company: string;
    productName: string;
    activeIngredient?: string | null;
    formula: string;
    customFormula?: string | null;
    applicationRate: string;
  }>;
  productUsedQty?: number | null;
  productUnitPrice?: number | null;
  otherExpenses?: number | null;
  cropImageUrls?: string[];
  plotImageUrls?: string[];
  imageUrls?: string[];
  notes?: string | null;
  plantingDate?: Date | null;
  plantingAreaCondition?: string | null;
  nextSprayDate?: Date | null;
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
      const ownerName =
        plan?.stores?.[0]?.store?.name || plan?.location || "เกษตรกร";
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
        const code = await generateDemoPlotCode(
          db,
          plan?.startDate
            ? new Date(plan.startDate)
            : data.visitDate
              ? new Date(data.visitDate)
              : new Date(),
        );

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
            plantingDate:
              data.plantingDate || plan?.startDate || data.visitDate,
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
  const baseStartDate =
    plot.initialSprayDate || plot.plantingDate || plot.startDate;
  const calculatedDaysSinceStart = Math.max(
    0,
    Math.floor(
      (data.visitDate.getTime() - new Date(baseStartDate).getTime()) / msPerDay,
    ),
  );
  const effectiveDaysSinceStart =
    data.daysSinceStart !== undefined && data.daysSinceStart !== null
      ? data.daysSinceStart
      : calculatedDaysSinceStart;

  const productUsedQty = data.productUsedQty || 0;
  const productUnitPrice = data.productUnitPrice || 0;
  const productCost = productUsedQty * productUnitPrice;
  const otherExpenses = data.otherExpenses || 0;
  const totalVisitCost = productCost + otherExpenses;

  const cropImageUrls = data.cropImageUrls || [];
  const plotImageUrls = data.plotImageUrls || [];
  const legacyImageUrls = data.imageUrls || plotImageUrls;

  return db.$transaction(async (tx) => {
    const existingVisit = data.activityPlanId
      ? await tx.demoPlotVisit.findFirst({
          where: {
            activityPlanId: data.activityPlanId,
            demoPlotId: plot.id,
          },
        })
      : null;

    let visit;
    if (existingVisit) {
      visit = await tx.demoPlotVisit.update({
        where: { id: existingVisit.id },
        data: {
          visitDate: data.visitDate,
          daysSinceStart: effectiveDaysSinceStart,
          cropAgeValue: data.cropAgeValue ?? null,
          cropAgeUnit: data.cropAgeUnit ?? null,
          growthStage: data.growthStage ?? null,
          cropCondition: data.cropCondition ?? null,
          cropProblemDesc: data.cropProblemDesc ?? null,
          productResponse: data.productResponse ?? null,
          productProblemDesc: data.productProblemDesc ?? null,
          usageMethod: data.usageMethod ?? null,
          sprayMethod: data.sprayMethod ?? null,
          sprayEquipment: data.sprayEquipment ?? null,
          otherEquipment: data.otherEquipment ?? null,
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
    } else {
      visit = await tx.demoPlotVisit.create({
        data: {
          demoPlotId: plot.id,
          activityPlanId: data.activityPlanId ?? null,
          visitNumber,
          visitDate: data.visitDate,
          daysSinceStart: effectiveDaysSinceStart,
          cropAgeValue: data.cropAgeValue ?? null,
          cropAgeUnit: data.cropAgeUnit ?? null,
          growthStage: data.growthStage ?? null,
          cropCondition: data.cropCondition ?? null,
          cropProblemDesc: data.cropProblemDesc ?? null,
          productResponse: data.productResponse ?? null,
          productProblemDesc: data.productProblemDesc ?? null,
          usageMethod: data.usageMethod ?? null,
          sprayMethod: data.sprayMethod ?? null,
          sprayEquipment: data.sprayEquipment ?? null,
          otherEquipment: data.otherEquipment ?? null,
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
    }

    // Sync external chemicals if provided
    if (data.externalProducts !== undefined) {
      await tx.demoPlotExternalProduct.deleteMany({
        where: { demoPlotId: plot.id },
      });
      if (
        data.sprayMethod === "TANK_MIXED" &&
        data.externalProducts.length > 0
      ) {
        await tx.demoPlotExternalProduct.createMany({
          data: data.externalProducts.slice(0, 4).map((ep, idx) => ({
            demoPlotId: plot.id,
            company: ep.company,
            productName: ep.productName,
            activeIngredient: ep.activeIngredient ?? null,
            formula: ep.formula,
            customFormula:
              ep.formula === "อื่นๆ" ? (ep.customFormula ?? null) : null,
            applicationRate: ep.applicationRate,
            sortOrder: idx,
          })),
        });
      }
    }

    // Update master plot initial info if not yet set or provided on visit
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
    if (data.nextSprayDate) {
      plotUpdateData.nextSprayDate = data.nextSprayDate;
    }
    if (data.sprayMethod) {
      plotUpdateData.sprayMethod = data.sprayMethod;
    }
    if (data.externalProducts !== undefined) {
      plotUpdateData.hasExternalChemicals =
        data.sprayMethod === "TANK_MIXED" && data.externalProducts.length > 0;
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
    }

    if (data.finalSummaryNotes !== undefined) {
      plotUpdateData.finalSummaryNotes = data.finalSummaryNotes;
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
