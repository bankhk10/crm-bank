import { db } from "@/lib/db";
import {
  Prisma,
  DemoPlotStatus,
  ActivityStatus,
  ActivityResultStatus,
} from "@prisma/client";
import type { Type14PlanInput } from "../types/planned.types";

/**
 * Fetch approved TYPE_13 Activity Plans with completed results and their Hattack demo plots
 * Strictly for TYPE_14 ("ติดตามแปลงแฮตแทค")
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
 * Fetch HATTACK demo plots for TYPE_14 "ติดตามแปลงแฮตแทค"
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
 * Creates ActivityPlanType14 records, plots, products, and visits in a Prisma Transaction
 */
export async function createType14Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type14Data: Type14PlanInput | undefined | null,
  startDate: Date = new Date(),
) {
  if (!type14Data) return;

  const created14 = await tx.activityPlanType14.create({
    data: {
      activityPlanId: planId,
      sourceActivityPlanId: type14Data.selectedPlanId || null,
      mode: type14Data.mode || "EXISTING_PLOT",
      hasProducts: Boolean(
        type14Data.withdrawnProducts && type14Data.withdrawnProducts.length > 0,
      ),
      notes: type14Data.notes || null,
    },
  });

  // Handle plots
  const plotIds =
    type14Data.selectedPlotIds ||
    type14Data.demoPlotIds ||
    (type14Data.demoPlotId ? [type14Data.demoPlotId] : []);

  if (plotIds.length > 0) {
    const existingDemoPlots = await tx.demoPlot.findMany({
      where: { id: { in: plotIds } },
    });

    for (const plotId of plotIds) {
      const demoPlot = existingDemoPlots.find((p) => p.id === plotId);
      await tx.activityPlanType14Plot.create({
        data: {
          type14Id: created14.id,
          demoPlotId: plotId,
          plotName: demoPlot?.name || type14Data.name || null,
          dealerName: demoPlot?.ownerName || type14Data.dealerName || null,
          ownerName: demoPlot?.ownerName || type14Data.ownerName || null,
          cropCategory:
            demoPlot?.cropCategory || type14Data.cropCategory || null,
          cropName: demoPlot?.cropName || type14Data.cropName || null,
          province: demoPlot?.province || type14Data.province || null,
          district: demoPlot?.district || type14Data.district || null,
          latitude:
            demoPlot?.latitude ??
            (type14Data.latitude
              ? new Prisma.Decimal(type14Data.latitude)
              : null),
          longitude:
            demoPlot?.longitude ??
            (type14Data.longitude
              ? new Prisma.Decimal(type14Data.longitude)
              : null),
        },
      });

      // Ensure DemoPlotVisit is created or linked for TYPE_14
      const existingVisit = await tx.demoPlotVisit.findFirst({
        where: {
          activityPlanId: planId,
          demoPlotId: plotId,
          workTypeCode: "TYPE_14",
        },
      });

      if (!existingVisit) {
        const visitCount = await tx.demoPlotVisit.count({
          where: { demoPlotId: plotId },
        });

        await tx.demoPlotVisit.create({
          data: {
            demoPlotId: plotId,
            activityPlanId: planId,
            workTypeCode: "TYPE_14",
            visitNumber: visitCount + 1,
            visitDate: startDate,
            daysSinceStart: 0,
            notes: `สร้างจากแผนงานติดตามแปลงแฮตแทค (TYPE_14)`,
          },
        });
      }
    }
  } else if (type14Data.mode === "NEW_PLOT" && type14Data.name) {
    await tx.activityPlanType14Plot.create({
      data: {
        type14Id: created14.id,
        demoPlotId: null,
        plotName: type14Data.name,
        dealerName: type14Data.dealerName || null,
        ownerName: type14Data.ownerName || null,
        cropCategory: type14Data.cropCategory || null,
        cropName: type14Data.cropName || null,
        province: type14Data.province || null,
        district: type14Data.district || null,
        latitude: type14Data.latitude
          ? new Prisma.Decimal(type14Data.latitude)
          : null,
        longitude: type14Data.longitude
          ? new Prisma.Decimal(type14Data.longitude)
          : null,
      },
    });
  }

  // Handle withdrawn products
  if (type14Data.withdrawnProducts && type14Data.withdrawnProducts.length > 0) {
    await tx.activityPlanType14Product.createMany({
      data: type14Data.withdrawnProducts
        .filter((p) => Boolean(p.productId))
        .map((p, idx) => ({
          type14Id: created14.id,
          productId: p.productId,
          productName: p.productName || null,
          quantity: new Prisma.Decimal(p.quantity || 1),
          unit: p.unit || "ขวด",
          sortOrder: idx + 1,
        })),
    });
  }
}

/**
 * Syncs (Updates) ActivityPlanType14 records in a transaction
 */
export async function syncType14Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type14Data: Type14PlanInput | undefined | null,
  startDate: Date = new Date(),
  _employeeId?: string,
) {
  const existing = await tx.activityPlanType14.findUnique({
    where: { activityPlanId: planId },
  });

  if (existing) {
    await tx.activityPlanType14Product.deleteMany({
      where: { type14Id: existing.id },
    });
    await tx.activityPlanType14Plot.deleteMany({
      where: { type14Id: existing.id },
    });
    await tx.activityPlanType14.delete({
      where: { id: existing.id },
    });
  }

  if (type14Data) {
    await createType14Data(tx, planId, type14Data, startDate);
  }
}

/**
 * Fetch TYPE_14 records with relations for a given plan
 */
export async function findType14ByPlanId(planId: string) {
  return db.activityPlanType14.findUnique({
    where: { activityPlanId: planId },
    include: {
      plots: {
        include: {
          demoPlot: true,
        },
      },
      products: {
        include: {
          product: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      sourceActivityPlan: {
        select: { id: true, title: true, code: true },
      },
    },
  });
}
