import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus } from "@prisma/client";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";

export interface Type13PlotProductInput {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface Type13PlotInput {
  id?: string;
  demoPlotId?: string | null;
  plotIndex?: number;
  name?: string | null;
  plotName?: string | null;
  storeId?: string | null;
  dealerName?: string | null;
  ownerName?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  village?: string | null;
  plannedPlotsCount?: number | string | null;
  latitude?: string | number | Prisma.Decimal | null;
  longitude?: string | number | Prisma.Decimal | null;
  products?: Type13PlotProductInput[];
}

export interface Type13WithdrawnProductInput {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface Type13DataInput {
  hasProducts?: boolean;
  hasProductWithdrawal?: boolean;
  notes?: string | null;
  plots?: Type13PlotInput[];
  products?: Type13WithdrawnProductInput[];
  withdrawnProducts?: Type13WithdrawnProductInput[];
}

/**
 * Generate DemoPlot Code (format: DPYYMMXXXX) with advisory lock
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

  try {
    await (tx as any).$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;
  } catch {
    // If not supported, proceed with scan
  }

  const existingPlots = await tx.demoPlot.findMany({
    where: {
      code: { startsWith: prefix },
    },
    select: { code: true },
  });

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

/**
 * Creates ActivityPlanType13Target & Product records, and associated DemoPlot + Visits in a Prisma Transaction
 */
export async function createType13Data(
  tx: PrismaTransaction,
  planId: string,
  type13Data: Type13DataInput | undefined | null,
  startDate: Date,
  employeeId: string,
) {
  if (!type13Data) return;

  const rawProducts = type13Data.products || type13Data.withdrawnProducts || [];
  const validProducts = rawProducts.filter((p) => Boolean(p.productId));

  const plots = type13Data.plots || [];
  let primaryTargetId: string | null = null;

  if (plots.length > 0) {
    const existingVisits = await tx.demoPlotVisit.findMany({
      where: {
        activityPlanId: planId,
        workTypeCode: "TYPE_13",
      },
      orderBy: { createdAt: "asc" },
    });

    const claimedDemoPlotIds = new Set<string>(
      plots.map((p) => p.demoPlotId).filter(Boolean) as string[],
    );

    const unclaimedVisits = existingVisits.filter(
      (v) => v.demoPlotId && !claimedDemoPlotIds.has(v.demoPlotId),
    );
    let unclaimedIdx = 0;

    for (let i = 0; i < plots.length; i++) {
      const plotItem = plots[i];
      let demoPlotId = plotItem.demoPlotId || null;

      if (!demoPlotId && unclaimedIdx < unclaimedVisits.length) {
        demoPlotId = unclaimedVisits[unclaimedIdx++].demoPlotId;
        const updateData: any = {};
        if (plotItem.name || plotItem.plotName) {
          updateData.name = plotItem.name || plotItem.plotName;
        }
        if (plotItem.storeId) {
          updateData.customerId = plotItem.storeId;
        }
        if (plotItem.province) {
          updateData.province = plotItem.province;
        }
        if (plotItem.district) {
          updateData.district = plotItem.district;
        }
        if (
          plotItem.latitude != null &&
          String(plotItem.latitude).trim() !== ""
        ) {
          updateData.latitude = new Prisma.Decimal(Number(plotItem.latitude));
        }
        if (
          plotItem.longitude != null &&
          String(plotItem.longitude).trim() !== ""
        ) {
          updateData.longitude = new Prisma.Decimal(Number(plotItem.longitude));
        }
        if (Object.keys(updateData).length > 0) {
          await tx.demoPlot.update({
            where: { id: demoPlotId },
            data: updateData,
          });
        }
      } else if (!demoPlotId) {
        const code = await generateDemoPlotCode(
          tx as any,
          startDate ? new Date(startDate) : new Date(),
          i,
        );

        const demoPlot = await tx.demoPlot.create({
          data: {
            code,
            name: plotItem.name || plotItem.plotName || `แปลงแฮตแทค ${i + 1}`,
            ownerName: plotItem.ownerName || "",
            customerId: plotItem.storeId || null,
            employeeId,
            province: plotItem.province || null,
            district: plotItem.district || null,
            location:
              [
                plotItem.subdistrict ? `ต.${plotItem.subdistrict}` : null,
                plotItem.village ? `ม.${plotItem.village}` : null,
                plotItem.plannedPlotsCount
                  ? `แผน ${plotItem.plannedPlotsCount} แปลง`
                  : null,
              ]
                .filter(Boolean)
                .join(" ") || null,
            latitude:
              plotItem.latitude != null &&
              String(plotItem.latitude).trim() !== ""
                ? new Prisma.Decimal(Number(plotItem.latitude))
                : null,
            longitude:
              plotItem.longitude != null &&
              String(plotItem.longitude).trim() !== ""
                ? new Prisma.Decimal(Number(plotItem.longitude))
                : null,
            plotType: "HATTACK",
            startDate,
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });
        demoPlotId = demoPlot.id;
      }

      const createdTarget = await tx.activityPlanType13Target.create({
        data: {
          activityPlanId: planId,
          plotIndex: plotItem.plotIndex || i + 1,
          plotName: plotItem.name || plotItem.plotName || `แปลงแฮตแทค ${i + 1}`,
          storeId: plotItem.storeId || null,
          dealerName: plotItem.dealerName || null,
          ownerName: plotItem.ownerName || null,
          province: plotItem.province || "",
          district: plotItem.district || "",
          subdistrict: plotItem.subdistrict || null,
          village: plotItem.village || null,
          plannedPlotsCount:
            plotItem.plannedPlotsCount != null
              ? Number(plotItem.plannedPlotsCount)
              : null,
          latitude:
            plotItem.latitude != null && String(plotItem.latitude).trim() !== ""
              ? new Prisma.Decimal(Number(plotItem.latitude))
              : null,
          longitude:
            plotItem.longitude != null &&
            String(plotItem.longitude).trim() !== ""
              ? new Prisma.Decimal(Number(plotItem.longitude))
              : null,
          demoPlotId,
          notes: type13Data.notes || null,
        },
      });

      if (i === 0) {
        primaryTargetId = createdTarget.id;
      }

      if (demoPlotId) {
        const existingVisit = await tx.demoPlotVisit.findFirst({
          where: {
            activityPlanId: planId,
            demoPlotId,
            workTypeCode: "TYPE_13",
          },
        });
        if (!existingVisit) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId,
              activityPlanId: planId,
              workTypeCode: "TYPE_13",
              visitNumber: 1,
              visitDate: startDate,
            },
          });
        }
      }
    }
  }

  if (validProducts.length > 0) {
    const pIds = validProducts.map((p) => p.productId);
    const dbProds = await tx.product.findMany({
      where: { id: { in: pIds } },
      select: { id: true, name: true, unit: true },
    });
    const pMap = new Map(dbProds.map((p) => [p.id, p]));

    await tx.activityPlanType13Product.createMany({
      data: validProducts.map((p, idx) => {
        const dbP = pMap.get(p.productId);
        return {
          activityPlanId: planId,
          targetId: primaryTargetId,
          productId: p.productId,
          productName: p.productName || dbP?.name || null,
          quantity:
            p.quantity != null
              ? new Prisma.Decimal(Number(p.quantity))
              : new Prisma.Decimal(1),
          unit: p.unit || dbP?.unit || null,
          sortOrder: idx,
        };
      }),
    });
  }
}

/**
 * Synchronizes ActivityPlanType13Target & Product records when updating an ActivityPlan
 */
export async function syncType13Data(
  tx: PrismaTransaction,
  planId: string,
  type13Data: Type13DataInput | undefined | null,
  startDate: Date,
  employeeId: string,
) {
  if (type13Data === undefined) return;

  await tx.activityPlanType13Product.deleteMany({
    where: { activityPlanId: planId },
  });
  await tx.activityPlanType13Target.deleteMany({
    where: { activityPlanId: planId },
  });

  if (type13Data) {
    await createType13Data(tx, planId, type13Data, startDate, employeeId);
  }
}

/**
 * Fetch TYPE_13 records with relations for a given plan
 */
export async function findType13ByPlanId(planId: string) {
  const [targets, products, results] = await Promise.all([
    db.activityPlanType13Target.findMany({
      where: { activityPlanId: planId },
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
    }),
    db.activityPlanType13Product.findMany({
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
    db.activityResultType13.findMany({
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

  return {
    id: targets[0]?.id || planId,
    activityPlanId: planId,
    hasProducts: products.length > 0,
    notes: targets[0]?.notes || null,
    plots: targets,
    products,
    results,
  };
}
