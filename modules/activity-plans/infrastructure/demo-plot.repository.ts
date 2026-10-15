import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus, ActivityStatus, ActivityResultStatus } from "@prisma/client";
import { generateDemoPlotCode } from "./activity-plan.repository";

/**
 * Demo Plot Repository
 * Handles DemoPlot queries, history, master plots, and plot-related customer lookups.
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
  plantingDate?: Date | null;
  plantingAreaCondition?: string | null;
  nextSprayDate?: Date | null;
  productUsedQty?: number | null;
  productUnitPrice?: number | null;
  otherExpenses?: number | null;
  cropImageUrls?: string[];
  plotImageUrls?: string[];
  imageUrls?: string[];
  notes?: string | null;
  recommendations?: string | null;
  nextFollowUpDate?: Date | null;
  plotStatus?: DemoPlotStatus;
  finalYieldKg?: number | null;
  controlYieldKg?: number | null;
  yieldIncreasePercent?: number | null;
  farmerSatisfaction?: number | null;
  commercialPotential?: string | null;
  finalSummaryNotes?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const visitCount = await tx.demoPlotVisit.count({
      where: { demoPlotId: data.demoPlotId },
    });

    const visit = await tx.demoPlotVisit.create({
      data: {
        demoPlotId: data.demoPlotId,
        activityPlanId: data.activityPlanId ?? null,
        visitNumber: visitCount + 1,
        visitDate: data.visitDate,
        daysSinceStart: data.daysSinceStart ?? 0,
        cropAgeValue: data.cropAgeValue ?? null,
        cropAgeUnit: data.cropAgeUnit ?? "วัน",
        growthStage: data.growthStage ?? null,
        cropCondition: data.cropCondition ?? null,
        cropProblemDesc: data.cropProblemDesc ?? null,
        productResponse: data.productResponse ?? null,
        productProblemDesc: data.productProblemDesc ?? null,
        usageMethod: data.usageMethod ?? null,
        sprayMethod: data.sprayMethod ?? null,
        sprayEquipment: data.sprayEquipment ?? null,
        otherEquipment: data.otherEquipment ?? null,
        cropImageUrls: data.cropImageUrls || [],
        plotImageUrls: data.plotImageUrls || [],
        imageUrls: data.imageUrls || data.plotImageUrls || [],
        productUsedQty:
          data.productUsedQty != null
            ? Math.round(Number(data.productUsedQty))
            : null,
        productUnitPrice:
          data.productUnitPrice != null
            ? new Prisma.Decimal(data.productUnitPrice)
            : null,
        totalVisitCost:
          data.productUsedQty != null && data.productUnitPrice != null
            ? new Prisma.Decimal(data.productUsedQty * data.productUnitPrice)
            : null,
        otherExpenses:
          data.otherExpenses != null
            ? new Prisma.Decimal(data.otherExpenses)
            : null,
        notes: data.notes ?? null,
      },
    });

    const plotUpdateData: Prisma.DemoPlotUpdateInput = {};
    if (data.plantingDate) {
      plotUpdateData.plantingDate = data.plantingDate;
    }
    if (data.plantingAreaCondition) {
      plotUpdateData.plantingAreaCondition = data.plantingAreaCondition;
    }
    if (data.nextSprayDate) {
      plotUpdateData.nextSprayDate = data.nextSprayDate;
    }
    if (data.plotStatus) {
      plotUpdateData.status = data.plotStatus;
      if (data.plotStatus === DemoPlotStatus.COMPLETED) {
        plotUpdateData.closedDate = data.visitDate;
      }
    }
    if (data.finalYieldKg != null) {
      plotUpdateData.demoYieldKg = new Prisma.Decimal(data.finalYieldKg);
    }
    if (data.controlYieldKg != null) {
      plotUpdateData.controlYieldKg = new Prisma.Decimal(data.controlYieldKg);
    }
    if (data.yieldIncreasePercent != null) {
      plotUpdateData.yieldIncreasePercent = new Prisma.Decimal(
        data.yieldIncreasePercent,
      );
    }
    if (data.farmerSatisfaction != null) {
      plotUpdateData.farmerSatisfaction = data.farmerSatisfaction;
    }
    if (data.commercialPotential) {
      plotUpdateData.commercialPotential = data.commercialPotential;
    }
    if (data.finalSummaryNotes !== undefined) {
      plotUpdateData.finalSummaryNotes = data.finalSummaryNotes;
    }

    if (Object.keys(plotUpdateData).length > 0) {
      await tx.demoPlot.update({
        where: { id: data.demoPlotId },
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
      OR: [{ customerType: "FARMER" }, { farmPlots: { not: Prisma.DbNull } }],
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
 * Isolated to GENERAL_DEMO plots for TYPE_7A
 */
export async function findMasterDemoPlots() {
  return db.demoPlot.findMany({
    where: {
      deletedAt: null,
      plotType: "GENERAL_DEMO",
      status: { not: DemoPlotStatus.CANCELLED },
    },
    include: {
      customer: {
        select: { id: true, name: true, customerCode: true },
      },
      demoProducts: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      externalProducts: {
        orderBy: { sortOrder: "asc" },
      },
      irrigations: true,
      attachments: true,
      visits: {
        orderBy: { visitDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch approved TYPE_13 Activity Plans with completed results and their Hattack demo plots
 * Strictly for TYPE_14 ("ติดตามแปลงแฮทแทค")
 */
export async function findHattackFollowUpActivityPlans() {
  return db.activityPlan.findMany({
    where: {
      deletedAt: null,
      status: ActivityStatus.APPROVED,
      result: {
        resultStatus: ActivityResultStatus.COMPLETED,
      },
      OR: [
        { activityType: { code: "TYPE_13" } },
        { workTypes: { some: { activityType: { code: "TYPE_13" } } } },
      ],
    },
    include: {
      stores: {
        include: {
          store: {
            select: { id: true, name: true, customerCode: true },
          },
        },
      },
      demoPlotVisits: {
        where: {
          demoPlot: {
            plotType: "HATTACK",
            deletedAt: null,
            status: { not: DemoPlotStatus.CANCELLED },
          },
        },
        include: {
          demoPlot: {
            include: {
              customer: {
                select: { id: true, name: true, customerCode: true },
              },
              farmerCustomer: {
                select: { id: true, name: true, customerCode: true },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

/**
 * Fetch HATTACK demo plots for TYPE_14 "ติดตามแปลงแฮทแทค"
 * Returns plots with plotType = "HATTACK" (excluding CANCELLED and deleted)
 */
export async function findHattackFollowUpDemoPlots() {
  return db.demoPlot.findMany({
    where: {
      deletedAt: null,
      plotType: "HATTACK",
      status: { not: DemoPlotStatus.CANCELLED },
      visits: {
        some: {
          workTypeCode: "TYPE_13",
          activityPlan: {
            deletedAt: null,
            OR: [
              { activityType: { code: "TYPE_13" } },
              { workTypes: { some: { activityType: { code: "TYPE_13" } } } },
            ],
          },
        },
      },
    },
    include: {
      customer: { select: { id: true, name: true } },
      demoProducts: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      visits: {
        where: {
          activityPlan: {
            deletedAt: null,
          },
        },
        include: {
          activityPlan: {
            select: { id: true, title: true, code: true },
          },
        },
        orderBy: { visitDate: "asc" },
      },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch HATTACK plot context for TYPE_14 Actual:
 * - DemoPlot details (dealer, province, district, etc.)
 * - Previous spray rounds (ประวัติการฉีดพ่นจริง)
 */
export async function findHattackPlotContext(
  demoPlotId: string,
  currentPlanId?: string,
) {
  const [plot, sprayHistoryRounds] = await Promise.all([
    db.demoPlot.findUnique({
      where: { id: demoPlotId },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        farmerCustomer: { select: { id: true, name: true } },
      },
    }),
    db.activityResultSprayRound.findMany({
      where: {
        demoPlotId,
        ...(currentPlanId
          ? {
              activityResult: {
                activityPlanId: { not: currentPlanId },
              },
            }
          : {}),
      },
      include: {
        activityResult: {
          include: {
            activityPlan: {
              select: {
                id: true,
                code: true,
                title: true,
                activityType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
                unit: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { sprayDate: "asc" },
    }),
  ]);

  return {
    plot,
    sprayHistoryRounds,
  };
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
      addressLine: true,
      subdistrict: true,
      postalCode: true,
      parentDealerId: true,
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
      customer: true,
      farmerCustomer: true,
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
              status: true,
              activityType: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              workTypes: {
                select: {
                  activityType: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              },
              result: {
                select: {
                  id: true,
                  resultStatus: true,
                  sprayRounds: {
                    select: {
                      id: true,
                      roundNumber: true,
                      sprayDate: true,
                      sprayMethod: true,
                      sprayEquipment: true,
                      productResponse: true,
                    },
                  },
                },
              },
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
export async function findDemoPlotByOwnerAndCrop(
  ownerName: string,
  cropName: string,
) {
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
              status: true,
              activityType: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              workTypes: {
                select: {
                  activityType: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              },
              result: {
                select: {
                  id: true,
                  resultStatus: true,
                  sprayRounds: {
                    select: {
                      id: true,
                      roundNumber: true,
                      sprayDate: true,
                      sprayMethod: true,
                      sprayEquipment: true,
                      productResponse: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export interface DemoPlotDataInput {
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
}

/**
 * Creates or links DemoPlot and DemoPlotVisit records when creating an ActivityPlan
 */
export async function createDemoPlotForPlan(
  tx: Prisma.TransactionClient,
  planId: string,
  input: {
    startDate: Date;
    employeeId: string;
    demoPlotData?: DemoPlotDataInput | null;
    demoPlotId?: string | null;
    demoPlotIds?: string[] | null;
    type13Plots?: Array<any>;
    type7bData?: any;
    type7aPlots?: Array<any>;
    type14Data?: any;
  },
  workTypeCodes: string[],
  primaryCode: string,
) {
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
        activityPlanId: planId,
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
            activityPlanId: planId,
            workTypeCode: visitWorkType,
            visitDate: input.startDate,
          },
        });
      }
    }
  }
}

/**
 * Syncs DemoPlot and DemoPlotVisit records when updating an ActivityPlan
 */
export async function syncDemoPlotForPlan(
  tx: Prisma.TransactionClient,
  planId: string,
  updatedPlan: { startDate: Date; employeeId: string },
  planData: {
    demoPlotData?: DemoPlotDataInput | null;
    demoPlotId?: string | null;
    demoPlotIds?: string[] | null;
    type7bData?: any;
    type7aPlots?: any;
    type14Data?: any;
  },
  workTypeCodes?: string[],
) {
  if (planData.demoPlotData) {
    const existingVisit = await tx.demoPlotVisit.findFirst({
      where: { activityPlanId: planId },
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
            activityPlanId: planId,
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

      await tx.demoPlotVisit.deleteMany({ where: { activityPlanId: planId } });
      await tx.demoPlotVisit.create({
        data: {
          demoPlotId: newPlot.id,
          activityPlanId: planId,
          visitDate: updatedPlan.startDate,
        },
      });
    }
  } else if (
    (planData.demoPlotId !== undefined || planData.demoPlotIds !== undefined) &&
    planData.type7bData === undefined &&
    planData.type7aPlots === undefined &&
    planData.type14Data === undefined
  ) {
    await tx.demoPlotVisit.deleteMany({
      where: {
        activityPlanId: planId,
        workTypeCode: { in: ["TYPE_7B", "TYPE_10", "TYPE_14"] },
      },
    });
    const plotIdsToVisit =
      planData.demoPlotIds && planData.demoPlotIds.length > 0
        ? planData.demoPlotIds
        : planData.demoPlotId
          ? [planData.demoPlotId]
          : [];

    if (plotIdsToVisit.length > 0) {
      const currentCodes = workTypeCodes ?? [];
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
              activityPlanId: planId,
              workTypeCode: visitWorkType,
              visitDate: updatedPlan.startDate,
            },
          });
        }
      }
    }
  } else if (planData.demoPlotData === null) {
    await tx.demoPlotVisit.deleteMany({ where: { activityPlanId: planId } });
  }
}
