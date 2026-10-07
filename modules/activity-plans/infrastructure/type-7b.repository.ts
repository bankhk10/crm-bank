import { db } from "@/lib/db";
import {
  Prisma,
  DemoPlotStatus,
  ActivityStatus,
  ActivityResultStatus,
} from "@prisma/client";

export interface Type7bPlotInput {
  id?: string;
  demoPlotId?: string | null;
  plotName?: string | null;
  cropName?: string | null;
  farmerName?: string | null;
  ownerName?: string | null;
  province?: string | null;
  district?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  dealerName?: string | null;
  dealerStoreName?: string | null;
  latitude?: string | number | Prisma.Decimal | null;
  longitude?: string | number | Prisma.Decimal | null;
  notes?: string | null;
}

export interface Type7bProductInput {
  id?: string;
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  quantityUsed?: number | null;
  unit?: string | null;
  notes?: string | null;
}

export interface Type7bDataInput {
  sourceActivityPlanId?: string | null;
  demoPlotId?: string | null;
  objective?: string | null;
  notes?: string | null;
  hasProducts?: boolean;
  sprayRound?: number | null;
  daysSinceStart?: number | null;
  plots?: Type7bPlotInput[];
  products?: Type7bProductInput[];
}

/**
 * Creates ActivityPlanType7b records, plots, products, and visits in a Prisma Transaction
 */
export async function createType7bData(
  tx: Prisma.TransactionClient,
  planId: string,
  type7bData: Type7bDataInput | undefined | null,
  startDate: Date,
) {
  if (!type7bData) return;

  const created7b = await tx.activityPlanType7b.create({
    data: {
      activityPlanId: planId,
      sourceActivityPlanId: type7bData.sourceActivityPlanId || null,
      hasProducts: Boolean(
        type7bData.products && type7bData.products.length > 0,
      ),
      objective: type7bData.objective || type7bData.notes || null,
      notes: type7bData.objective || type7bData.notes || null,
    },
  });

  if (type7bData.plots && type7bData.plots.length > 0) {
    await tx.activityPlanType7bPlot.createMany({
      data: type7bData.plots
        .filter((p) => Boolean(p.demoPlotId))
        .map((plot) => ({
          type7bId: created7b.id,
          demoPlotId: plot.demoPlotId!,
          plotName: plot.plotName || null,
          cropName: plot.cropName || null,
          ownerName: plot.farmerName || plot.ownerName || null,
          province: plot.province || null,
          district: plot.district || null,
          areaRai:
            plot.areaRai != null ? new Prisma.Decimal(plot.areaRai) : null,
          treeCount: plot.treeCount || null,
          dealerName: plot.dealerStoreName || plot.dealerName || null,
        })),
    });

    for (const p of type7bData.plots) {
      if (p.demoPlotId) {
        const existingVisit = await tx.demoPlotVisit.findFirst({
          where: {
            activityPlanId: planId,
            demoPlotId: p.demoPlotId,
            workTypeCode: "TYPE_7B",
          },
        });
        if (!existingVisit) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId: p.demoPlotId,
              activityPlanId: planId,
              workTypeCode: "TYPE_7B",
              visitNumber: type7bData.sprayRound || 1,
              visitDate: startDate,
              daysSinceStart: type7bData.daysSinceStart || 0,
            },
          });
        }
      }
    }
  }

  const validProducts = (type7bData.products || []).filter(
    (p): p is typeof p & { productId: string } => Boolean(p.productId),
  );

  if (validProducts.length > 0) {
    const bProdIds = validProducts.map((p) => p.productId);
    const dbBProducts =
      bProdIds.length > 0
        ? await tx.product.findMany({
            where: { id: { in: bProdIds } },
            select: { id: true, name: true, unit: true },
          })
        : [];
    const bProductMap = new Map(dbBProducts.map((p) => [p.id, p]));

    await tx.activityPlanType7bProduct.createMany({
      data: validProducts.map((p, idx) => {
        const dbProd = bProductMap.get(p.productId);
        return {
          type7bId: created7b.id,
          productId: p.productId,
          productName: p.productName || dbProd?.name || null,
          quantity:
            p.quantity != null
              ? new Prisma.Decimal(p.quantity)
              : p.quantityUsed != null
                ? new Prisma.Decimal(p.quantityUsed)
                : new Prisma.Decimal(1),
          unit: p.unit || dbProd?.unit || null,
          sortOrder: idx,
        };
      }),
    });
  }
}

/**
 * Synchronizes ActivityPlanType7b records when updating an ActivityPlan
 */
export async function syncType7bData(
  tx: Prisma.TransactionClient,
  planId: string,
  type7bData: Type7bDataInput | undefined | null,
  startDate: Date,
) {
  if (type7bData === undefined) return;

  await tx.activityPlanType7b.deleteMany({
    where: { activityPlanId: planId },
  });

  if (type7bData) {
    const created7b = await tx.activityPlanType7b.create({
      data: {
        activityPlanId: planId,
        sourceActivityPlanId: type7bData.sourceActivityPlanId || null,
        hasProducts: Boolean(
          type7bData.products && type7bData.products.length > 0,
        ),
        objective: type7bData.objective || type7bData.notes || null,
        notes: type7bData.objective || type7bData.notes || null,
      },
    });

    if (type7bData.plots && type7bData.plots.length > 0) {
      await tx.activityPlanType7bPlot.createMany({
        data: type7bData.plots
          .filter((p) => Boolean(p.demoPlotId))
          .map((plot) => ({
            type7bId: created7b.id,
            demoPlotId: plot.demoPlotId!,
            plotName: plot.plotName || null,
            cropName: plot.cropName || null,
            ownerName: plot.farmerName || plot.ownerName || null,
            province: plot.province || null,
            district: plot.district || null,
            areaRai:
              plot.areaRai != null ? new Prisma.Decimal(plot.areaRai) : null,
            treeCount: plot.treeCount || null,
            dealerName: plot.dealerStoreName || plot.dealerName || null,
          })),
      });

      for (const p of type7bData.plots) {
        if (p.demoPlotId) {
          const existingVisit = await tx.demoPlotVisit.findFirst({
            where: {
              activityPlanId: planId,
              demoPlotId: p.demoPlotId,
              workTypeCode: "TYPE_7B",
            },
          });
          if (!existingVisit) {
            await tx.demoPlotVisit.create({
              data: {
                demoPlotId: p.demoPlotId,
                activityPlanId: planId,
                workTypeCode: "TYPE_7B",
                visitNumber: type7bData.sprayRound || 1,
                visitDate: startDate,
                daysSinceStart: type7bData.daysSinceStart || 0,
              },
            });
          }
        }
      }
    }

    const validUpdateProducts = (type7bData.products || []).filter(
      (p): p is typeof p & { productId: string } => Boolean(p.productId),
    );

    if (validUpdateProducts.length > 0) {
      const bProdIds = validUpdateProducts.map((p) => p.productId);
      const dbBProducts =
        bProdIds.length > 0
          ? await tx.product.findMany({
              where: { id: { in: bProdIds } },
              select: { id: true, name: true, unit: true },
            })
          : [];
      const bProductMap = new Map(dbBProducts.map((p) => [p.id, p]));

      await tx.activityPlanType7bProduct.createMany({
        data: validUpdateProducts.map((p, idx) => {
          const dbProd = bProductMap.get(p.productId);
          return {
            type7bId: created7b.id,
            productId: p.productId,
            productName: p.productName || dbProd?.name || null,
            quantity:
              p.quantity != null
                ? new Prisma.Decimal(p.quantity)
                : p.quantityUsed != null
                  ? new Prisma.Decimal(p.quantityUsed)
                  : new Prisma.Decimal(1),
            unit: p.unit || dbProd?.unit || null,
            sortOrder: idx,
          };
        }),
      });
    }
  }
}

/**
 * Fetch dedicated demo plots for TYPE_7B "ติดตามแปลงสาธิต"
 * Only returns plots originating from TYPE_7A plans that are APPROVED and COMPLETED ("ปฏิบัติงานแล้วเสร็จ")
 * Isolated to GENERAL_DEMO plots
 */
export async function findFollowUpDemoPlots() {
  return db.demoPlot.findMany({
    where: {
      deletedAt: null,
      plotType: "GENERAL_DEMO",
      status: { not: DemoPlotStatus.CANCELLED },
      visits: {
        some: {
          activityPlan: {
            deletedAt: null,
            status: ActivityStatus.APPROVED,
            result: {
              resultStatus: ActivityResultStatus.COMPLETED,
            },
            OR: [
              { activityType: { code: "TYPE_7A" } },
              { workTypes: { some: { activityType: { code: "TYPE_7A" } } } },
            ],
          },
        },
      },
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
 * Fetch approved TYPE_7A Activity Plans with completed results and their demo plots
 * Strictly for TYPE_7B ("ติดตามแปลงสาธิต")
 */
export async function findFollowUpActivityPlans() {
  return db.activityPlan.findMany({
    where: {
      deletedAt: null,
      status: ActivityStatus.APPROVED,
      result: {
        resultStatus: ActivityResultStatus.COMPLETED,
      },
      OR: [
        { activityType: { code: "TYPE_7A" } },
        { workTypes: { some: { activityType: { code: "TYPE_7A" } } } },
      ],
    },
    include: {
      demoPlotVisits: {
        where: {
          demoPlot: {
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
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

/**
 * Fetch TYPE_7B records with relations for a given plan
 */
export async function findType7bByPlanId(planId: string) {
  return db.activityPlanType7b.findUnique({
    where: { activityPlanId: planId },
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
  });
}
