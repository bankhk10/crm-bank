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
  const plans = await db.activityPlan.findMany({
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
      type13Targets: {
        some: {
          status: { not: DemoPlotStatus.CANCELLED },
        },
      },
    },
    include: {
      type13Targets: {
        where: {
          status: { not: DemoPlotStatus.CANCELLED },
        },
        include: {
          store: {
            select: { id: true, name: true, customerCode: true },
          },
          products: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return plans;
}

/**
 * Fetch HATTACK targets for TYPE_14 "ติดตามแปลงแฮตแทค"
 * Returns targets from activity_type_13_targets (excluding CANCELLED)
 */
export async function findHattackFollowUpDemoPlots() {
  return db.activityPlanType13Target.findMany({
    where: {
      status: { not: DemoPlotStatus.CANCELLED },
      activityPlan: {
        deletedAt: null,
        status: { not: ActivityStatus.CANCELLED },
      },
    },
    include: {
      store: { select: { id: true, name: true } },
      products: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      activityPlan: {
        select: { id: true, title: true, code: true, startDate: true },
      },
      type14Targets: true,
      type14Results: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Creates ActivityPlanType14Target & Product records in a Prisma Transaction
 */
export async function createType14Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type14Data: Type14PlanInput | undefined | null,
  _startDate: Date = new Date(),
) {
  if (!type14Data) return;

  // Resolve valid sourceActivityPlanId to prevent foreign key errors
  let validSourcePlanId = type14Data.selectedPlanId || null;
  if (validSourcePlanId) {
    const existingPlan = await tx.activityPlan.findUnique({
      where: { id: validSourcePlanId },
      select: { id: true },
    });
    if (!existingPlan) {
      validSourcePlanId = null;
    }
  }

  // Handle plots
  const plotIds =
    type14Data.selectedPlotIds ||
    type14Data.type13TargetIds ||
    type14Data.demoPlotIds ||
    (type14Data.type13TargetId ? [type14Data.type13TargetId] : []) ||
    (type14Data.demoPlotId ? [type14Data.demoPlotId] : []);

  let primaryTargetId: string | null = null;

  if (plotIds.length > 0) {
    const existingTargets = await tx.activityPlanType13Target.findMany({
      where: { id: { in: plotIds } },
    });

    for (let i = 0; i < plotIds.length; i++) {
      const plotId = plotIds[i];
      const target13 = existingTargets.find((p) => p.id === plotId);

      const target = await tx.activityPlanType14Target.create({
        data: {
          activityPlanId: planId,
          mode: type14Data.mode || "EXISTING_PLOT",
          sourceActivityPlanId: validSourcePlanId || target13?.activityPlanId || null,
          type13TargetId: plotId,
          plotName: target13?.plotName || type14Data.name || null,
          storeId: target13?.storeId || type14Data.storeId || null,
          dealerName: target13?.dealerName || type14Data.dealerName || null,
          ownerName: target13?.ownerName || type14Data.ownerName || null,
          cropCategory: type14Data.cropCategory || null,
          cropName: type14Data.cropName || null,
          province: target13?.province || type14Data.province || "",
          district: target13?.district || type14Data.district || "",
          latitude:
            target13?.latitude ??
            (type14Data.latitude
              ? new Prisma.Decimal(type14Data.latitude)
              : null),
          longitude:
            target13?.longitude ??
            (type14Data.longitude
              ? new Prisma.Decimal(type14Data.longitude)
              : null),
          notes: type14Data.notes || null,
        },
      });

      if (i === 0) {
        primaryTargetId = target.id;
      }
    }
  } else if (type14Data.mode === "NEW_PLOT" && type14Data.name) {
    const target = await tx.activityPlanType14Target.create({
      data: {
        activityPlanId: planId,
        mode: "NEW_PLOT",
        sourceActivityPlanId: validSourcePlanId,
        type13TargetId: null,
        plotName: type14Data.name,
        dealerName: type14Data.dealerName || null,
        ownerName: type14Data.ownerName || null,
        cropCategory: type14Data.cropCategory || null,
        cropName: type14Data.cropName || null,
        province: type14Data.province || "",
        district: type14Data.district || "",
        latitude: type14Data.latitude
          ? new Prisma.Decimal(type14Data.latitude)
          : null,
        longitude: type14Data.longitude
          ? new Prisma.Decimal(type14Data.longitude)
          : null,
        notes: type14Data.notes || null,
      },
    });
    primaryTargetId = target.id;
  }

  // Handle withdrawn products
  if (type14Data.withdrawnProducts && type14Data.withdrawnProducts.length > 0) {
    const validProds = type14Data.withdrawnProducts.filter((p) => Boolean(p.productId));
    if (validProds.length > 0) {
      const pIds = validProds.map((p) => p.productId);
      const dbProds = await tx.product.findMany({
        where: { id: { in: pIds } },
        select: { id: true, name: true, unit: true },
      });
      const pMap = new Map(dbProds.map((p) => [p.id, p]));

      await tx.activityPlanType14Product.createMany({
        data: validProds.map((p, idx) => {
          const dbP = pMap.get(p.productId);
          return {
            activityPlanId: planId,
            targetId: primaryTargetId,
            productId: p.productId,
            productName: p.productName || dbP?.name || null,
            quantity: new Prisma.Decimal(p.quantity || 1),
            unit: p.unit || dbP?.unit || "ขวด",
            sortOrder: idx + 1,
          };
        }),
      });
    }
  }
}

/**
 * Syncs (Updates) ActivityPlanType14Target & Product records in a transaction
 */
export async function syncType14Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type14Data: Type14PlanInput | undefined | null,
  startDate: Date = new Date(),
  _employeeId?: string,
) {
  if (type14Data === undefined) return;

  await tx.activityPlanType14Product.deleteMany({
    where: { activityPlanId: planId },
  });
  await tx.activityPlanType14Target.deleteMany({
    where: { activityPlanId: planId },
  });

  if (type14Data) {
    await createType14Data(tx, planId, type14Data, startDate);
  }
}

/**
 * Fetch TYPE_14 records with relations for a given plan
 */
export async function findType14ByPlanId(planId: string) {
  const [targets, products, results] = await Promise.all([
    db.activityPlanType14Target.findMany({
      where: { activityPlanId: planId },
      include: {
        type13Target: {
          include: {
            store: true,
            products: true,
          },
        },
        sourceActivityPlan: {
          select: { id: true, title: true, code: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.activityPlanType14Product.findMany({
      where: { activityPlanId: planId },
      include: {
        product: true,
      },
      orderBy: { sortOrder: "asc" },
    }),
    db.activityResultType14.findMany({
      where: { activityPlanId: planId },
      include: {
        productsUsed: {
          include: { product: true },
          orderBy: { sortOrder: "asc" },
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
    mode: primaryTarget?.mode || "EXISTING_PLOT",
    hasProducts: products.length > 0,
    notes: primaryTarget?.notes || null,
    plots: targets,
    products,
    results,
  };
}
