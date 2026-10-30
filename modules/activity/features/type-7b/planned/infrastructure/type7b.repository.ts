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
 * Creates ActivityPlanType7bTarget records and products in a Prisma Transaction
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
      // Check if it's a type7aTargetId with activityPlanId
      const matchedTarget = await tx.activityPlanType7aTarget.findUnique({
        where: { id: validSourcePlanId },
        select: { activityPlanId: true },
      });
      validSourcePlanId = matchedTarget?.activityPlanId || null;
    }
  }

  const rawPlots = type7bData.plots || (type7bData.type7aTargetId || type7bData.demoPlotId ? [{ type7aTargetId: type7bData.type7aTargetId || type7bData.demoPlotId }] : []);
  const validPlots = rawPlots.filter((p) => Boolean(p.type7aTargetId || p.demoPlotId));
  let createdTargetId: string | null = null;

  if (validPlots.length > 0) {
    for (let i = 0; i < validPlots.length; i++) {
      const plot = validPlots[i];
      const targetPlotId = plot.type7aTargetId || plot.demoPlotId;

      let validTargetPlotId: string | null = null;
      if (targetPlotId) {
        const t7a = await tx.activityPlanType7aTarget?.findUnique?.({
          where: { id: targetPlotId },
          select: { id: true, activityPlanId: true },
        });
        if (t7a) {
          validTargetPlotId = t7a.id;
          if (!validSourcePlanId && t7a.activityPlanId) {
            validSourcePlanId = t7a.activityPlanId;
          }
        }
      }

      const target = await tx.activityPlanType7bTarget.create({
        data: {
          activityPlanId: planId,
          type7aTargetId: validTargetPlotId,
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
      });

      if (i === 0) {
        createdTargetId = target.id;
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

  await tx.activityPlanType7bProduct.deleteMany({
    where: { activityPlanId: planId },
  });
  await tx.activityPlanType7bTarget.deleteMany({
    where: { activityPlanId: planId },
  });

  if (type7bData) {
    await createType7bData(tx, planId, type7bData, startDate);
  }
}

/**
 * Fetch dedicated demo plots for TYPE_7B "ติดตามแปลงสาธิต"
 * Returns active demo plots originating from non-cancelled TYPE_7A plans whose status is not closed/cancelled
 */
export async function findFollowUpDemoPlots(options?: {
  employeeId?: string;
  userId?: string;
}) {
  return db.activityPlanType7aTarget.findMany({
    where: {
      status: { notIn: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] },
      closedDate: null,
      activityPlan: {
        deletedAt: null,
        status: { not: ActivityStatus.CANCELLED },
        ...(options?.employeeId || options?.userId
          ? {
              OR: [
                ...(options.employeeId ? [{ employeeId: options.employeeId }] : []),
                ...(options.userId ? [{ createdById: options.userId }] : []),
              ],
            }
          : {}),
      },
    },
    include: {
      activityPlan: {
        select: { id: true, code: true, title: true, startDate: true, endDate: true },
      },
      store: {
        select: { id: true, name: true, customerCode: true },
      },
      products: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      results: {
        include: {
          irrigations: true,
          actualProducts: { include: { product: true } },
          sprayExternals: true,
          attachments: true,
        },
      },
      type7bTargets: true,
      type7bResults: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch follow-up options for TYPE_7B:
 * Returns TYPE_7A Activity Plans that have active demo plots (status not CANCELLED/COMPLETED, closedDate is null).
 */
export async function findFollowUpActivityPlans(options?: {
  employeeId?: string;
  userId?: string;
}): Promise<Type7bFollowUpPlanOption[]> {
  const whereCondition: any = {
    deletedAt: null,
    status: { not: ActivityStatus.CANCELLED },
    OR: [
      { activityType: { code: "TYPE_7A" } },
      { workTypes: { some: { activityType: { code: "TYPE_7A" } } } },
    ],
    type7aTargets: {
      some: {
        status: { notIn: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] },
        closedDate: null,
      },
    },
  };

  if (options?.employeeId || options?.userId) {
    whereCondition.AND = [
      {
        OR: [
          ...(options.employeeId ? [{ employeeId: options.employeeId }] : []),
          ...(options.userId ? [{ createdById: options.userId }] : []),
        ],
      },
    ];
  }

  const plans = await db.activityPlan.findMany({
    where: whereCondition,
    include: {
      type7aTargets: {
        where: {
          status: { notIn: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] },
          closedDate: null,
        },
        include: {
          store: {
            select: { id: true, name: true, customerCode: true, province: true, district: true },
          },
          results: true,
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
    plots: plan.type7aTargets.map((plot) => ({
      id: plot.id,
      code: plot.code || undefined,
      name: plot.plotName || "แปลงสาธิต",
      cropName: plot.cropName || plot.customCropName || plot.cropCategory || "พืชเกษตร",
      cropCategory: plot.cropCategory || undefined,
      ownerName: plot.results?.[0]?.farmerName || plot.store?.name || plot.dealerName || "-",
      province: plot.results?.[0]?.province || plot.store?.province || "",
      district: plot.results?.[0]?.district || plot.store?.district || "",
      areaRai: plot.areaRai ? Number(plot.areaRai) : undefined,
      treeCount: plot.treeCount ?? undefined,
      dealerName: plot.store?.name || plot.dealerName || undefined,
      dealerId: plot.storeId || undefined,
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
        type7aTarget: {
          include: {
            store: true,
            products: {
              include: { product: true },
            },
            results: true,
          },
        },
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
