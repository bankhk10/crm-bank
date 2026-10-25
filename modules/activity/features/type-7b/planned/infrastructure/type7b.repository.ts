import { db } from "@/lib/db";
import {
  Prisma,
  DemoPlotStatus,
  ActivityStatus,
} from "@prisma/client";
import type {
  Type7bDataInput,
  Type7bFollowUpPlanOption,
} from "../../shared/types";

/**
 * Creates ActivityPlanType7bTarget records, products, and visits in a Prisma Transaction
 */
export async function createType7bData(
  tx: Prisma.TransactionClient,
  planId: string,
  type7bData: Type7bDataInput | undefined | null,
  startDate: Date = new Date(),
) {
  if (!type7bData) return;

  // Resolve valid sourceActivityPlanId to prevent Foreign Key constraint violations
  let validSourcePlanId = type7bData.sourceActivityPlanId || null;
  if (validSourcePlanId) {
    const existingPlan = await tx.activityPlan.findUnique({
      where: { id: validSourcePlanId },
      select: { id: true },
    });
    if (!existingPlan) {
      // Check if it's a demoPlotId with activityPlanId
      const matchedPlot = await tx.demoPlot.findUnique({
        where: { id: validSourcePlanId },
        select: { activityPlanId: true },
      });
      validSourcePlanId = matchedPlot?.activityPlanId || null;
    }
  }

  const rawPlots = type7bData.plots || (type7bData.demoPlotId ? [{ demoPlotId: type7bData.demoPlotId }] : []);
  const validPlots = rawPlots.filter((p) => Boolean(p.demoPlotId));
  let createdTargetId: string | null = null;

  if (validPlots.length > 0) {
    for (let i = 0; i < validPlots.length; i++) {
      const plot = validPlots[i];
      const targetDelegate =
        (tx as any).activityPlanType7bTarget ||
        (tx as any).activityPlanType7bPlot;
      const target = targetDelegate?.create
        ? await targetDelegate.create({
            data: {
              activityPlanId: planId,
              demoPlotId: plot.demoPlotId!,
              sourceActivityPlanId: validSourcePlanId,
              plotName: plot.plotName || null,
              cropName: plot.cropName || null,
              ownerName: plot.farmerName || plot.ownerName || null,
              province: plot.province || null,
              district: plot.district || null,
              areaRai: plot.areaRai != null ? new Prisma.Decimal(plot.areaRai) : null,
              treeCount: plot.treeCount || null,
              dealerName: plot.dealerStoreName || plot.dealerName || null,
              objective: type7bData.objective || type7bData.notes || null,
              notes: type7bData.notes || null,
            },
          })
        : { id: `target-${i}` };
      if (i === 0) {
        createdTargetId = target.id;
      }

      // Sync initial visit in DemoPlotVisit timeline
      const existingVisit = await tx.demoPlotVisit.findFirst({
        where: {
          activityPlanId: planId,
          demoPlotId: plot.demoPlotId!,
          workTypeCode: "TYPE_7B",
        },
      });
      if (!existingVisit) {
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId: plot.demoPlotId!,
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

  const validProducts = (type7bData.products || []).filter(
    (p): p is typeof p & { productId: string } => Boolean(p.productId || p.productName),
  );

  if (validProducts.length > 0) {
    const bProdIds = validProducts.map((p) => p.productId).filter(Boolean);
    const bProdNames = validProducts.map((p) => p.productName).filter(Boolean) as string[];

    const dbBProducts =
      bProdIds.length > 0 || bProdNames.length > 0
        ? await tx.product.findMany({
            where: {
              OR: [
                ...(bProdIds.length > 0 ? [{ id: { in: bProdIds } }] : []),
                ...(bProdIds.length > 0 ? [{ name: { in: bProdIds } }] : []),
                ...(bProdNames.length > 0 ? [{ name: { in: bProdNames } }] : []),
              ],
            },
            select: { id: true, name: true, unit: true },
          })
        : [];

    const bProductMapById = new Map(dbBProducts.map((p) => [p.id, p]));
    const bProductMapByName = new Map(dbBProducts.map((p) => [p.name, p]));

    const productsToInsert = validProducts
      .map((p, idx) => {
        const dbProd =
          bProductMapById.get(p.productId) ||
          bProductMapByName.get(p.productId) ||
          (p.productName ? bProductMapByName.get(p.productName) : undefined);

        if (!dbProd) {
          console.warn(
            `[Type7B createType7bData] Product "${p.productId || p.productName}" not found in database. Skipped to prevent foreign key violation.`,
          );
          return null;
        }

        return {
          activityPlanId: planId,
          targetId: createdTargetId,
          productId: dbProd.id,
          productName: p.productName || dbProd.name || null,
          quantity:
            p.quantity != null
              ? new Prisma.Decimal(p.quantity)
              : p.quantityUsed != null
                ? new Prisma.Decimal(p.quantityUsed)
                : new Prisma.Decimal(1),
          unit: p.unit || dbProd.unit || null,
          sortOrder: idx,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (productsToInsert.length > 0) {
      await tx.activityPlanType7bProduct.createMany({
        data: productsToInsert,
      });
    }
  }
}

/**
 * Synchronizes ActivityPlanType7bTarget & Product records when updating an ActivityPlan
 */
export async function syncType7bData(
  tx: Prisma.TransactionClient,
  planId: string,
  type7bData: Type7bDataInput | undefined | null,
  startDate: Date = new Date(),
) {
  if (type7bData === undefined) return;

  if ((tx as any).activityPlanType7bProduct?.deleteMany) {
    await (tx as any).activityPlanType7bProduct.deleteMany({
      where: { activityPlanId: planId },
    });
  }
  if ((tx as any).activityPlanType7bTarget?.deleteMany) {
    await (tx as any).activityPlanType7bTarget.deleteMany({
      where: { activityPlanId: planId },
    });
  } else if ((tx as any).activityPlanType7bPlot?.deleteMany) {
    await (tx as any).activityPlanType7bPlot.deleteMany({
      where: { activityPlanId: planId },
    });
  }

  if (type7bData) {
    await createType7bData(tx, planId, type7bData, startDate);
  }
}

/**
 * Fetch dedicated demo plots for TYPE_7B "ติดตามแปลงสาธิต"
 * Returns active demo plots originating from non-cancelled TYPE_7A plans whose status is not closed/cancelled
 */
export async function findFollowUpDemoPlots() {
  return db.demoPlot.findMany({
    where: {
      deletedAt: null,
      plotType: "GENERAL_DEMO",
      status: { notIn: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] },
      closedDate: null,
      activityPlan: {
        deletedAt: null,
        status: { not: ActivityStatus.CANCELLED },
        OR: [
          { activityType: { code: "TYPE_7A" } },
          { workTypes: { some: { activityType: { code: "TYPE_7A" } } } },
        ],
      },
    },
    include: {
      customer: {
        select: { id: true, name: true, customerCode: true },
      },
      farmerCustomer: {
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
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Fetch follow-up options for TYPE_7B:
 * Returns TYPE_7A Activity Plans that have active demo plots (status not CANCELLED/COMPLETED, closedDate is null).
 */
export async function findFollowUpActivityPlans(): Promise<Type7bFollowUpPlanOption[]> {
  const plans = await db.activityPlan.findMany({
    where: {
      deletedAt: null,
      status: { not: ActivityStatus.CANCELLED },
      OR: [
        { activityType: { code: "TYPE_7A" } },
        { workTypes: { some: { activityType: { code: "TYPE_7A" } } } },
      ],
      type7aPlots: {
        some: {
          deletedAt: null,
          status: { notIn: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] },
          closedDate: null,
        },
      },
    },
    include: {
      type7aPlots: {
        where: {
          deletedAt: null,
          status: { notIn: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] },
          closedDate: null,
        },
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
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });

  return plans.map((plan) => ({
    planId: plan.id,
    planCode: plan.code || undefined,
    planTitle: plan.title,
    planDate: plan.startDate
      ? new Date(plan.startDate).toLocaleDateString("th-TH")
      : undefined,
    plots: plan.type7aPlots.map((plot) => ({
      id: plot.id,
      code: plot.code,
      name: plot.name,
      cropName: plot.cropName || plot.customCropName || plot.cropCategory || "พืชเกษตร",
      cropCategory: plot.cropCategory || undefined,
      ownerName: plot.ownerName || plot.farmerCustomer?.name || "-",
      province: plot.province || "",
      district: plot.district || "",
      areaRai: plot.areaRai ? Number(plot.areaRai) : undefined,
      treeCount: plot.treeCount ?? undefined,
      dealerName: plot.customer?.name,
      dealerId: plot.customerId || undefined,
    })),
  }));
}

/**
 * Fetch TYPE_7B records with relations for a given plan
 */
export async function findType7bByPlanId(planId: string) {
  const [targets, products, results] = await Promise.all([
    db.activityPlanType7bTarget.findMany({
      where: { activityPlanId: planId },
      include: {
        demoPlot: true,
        sourceActivityPlan: {
          select: {
            id: true,
            code: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    }),
    db.activityPlanType7bProduct.findMany({
      where: { activityPlanId: planId },
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
    }),
    db.activityResultType7b.findMany({
      where: { activityPlanId: planId },
      include: {
        sprayRounds: {
          include: {
            sprayProducts: {
              include: { product: true },
              orderBy: { sortOrder: "asc" },
            },
            sprayExternals: {
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
        attachments: true,
      },
    }),
  ]);

  if (targets.length === 0 && products.length === 0 && results.length === 0) {
    return null;
  }

  const primaryTarget = targets[0];
  return {
    id: primaryTarget?.id || planId,
    activityPlanId: planId,
    sourceActivityPlanId: primaryTarget?.sourceActivityPlanId || null,
    sourceActivityPlan: primaryTarget?.sourceActivityPlan || null,
    hasProducts: products.length > 0,
    objective: primaryTarget?.objective || null,
    notes: primaryTarget?.notes || null,
    plots: targets,
    products,
    results,
  };
}
