import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus } from "@prisma/client";
import { generateDemoPlotCode } from "./activity-plan.repository";

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
  latitude?: string | number | null;
  longitude?: string | number | null;
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
 * Creates ActivityPlanType13 records, plots, products, and associated DemoPlot + Visits in a Prisma Transaction
 */
export async function createType13Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type13Data: Type13DataInput | undefined | null,
  startDate: Date,
  employeeId: string,
) {
  if (!type13Data) return;

  const rawProducts = type13Data.products || type13Data.withdrawnProducts || [];
  const validProducts = rawProducts.filter((p) => Boolean(p.productId));
  const hasProducts = Boolean(
    type13Data.hasProducts || type13Data.hasProductWithdrawal || validProducts.length > 0,
  );

  const t13 = await tx.activityPlanType13.create({
    data: {
      activityPlanId: planId,
      hasProducts,
      notes: type13Data.notes || null,
    },
  });

  const plots = type13Data.plots || [];
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
          tx,
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
            latitude:
              plotItem.latitude != null && String(plotItem.latitude).trim() !== ""
                ? new Prisma.Decimal(Number(plotItem.latitude))
                : null,
            longitude:
              plotItem.longitude != null && String(plotItem.longitude).trim() !== ""
                ? new Prisma.Decimal(Number(plotItem.longitude))
                : null,
            plotType: "HATTACK",
            startDate,
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });
        demoPlotId = demoPlot.id;
      }

      await tx.activityPlanType13Plot.create({
        data: {
          type13Id: t13.id,
          plotIndex: plotItem.plotIndex || i + 1,
          plotName: plotItem.name || plotItem.plotName || `แปลงแฮตแทค ${i + 1}`,
          storeId: plotItem.storeId || null,
          dealerName: plotItem.dealerName || null,
          ownerName: plotItem.ownerName || null,
          province: plotItem.province || null,
          district: plotItem.district || null,
          latitude:
            plotItem.latitude != null && String(plotItem.latitude).trim() !== ""
              ? new Prisma.Decimal(Number(plotItem.latitude))
              : null,
          longitude:
            plotItem.longitude != null && String(plotItem.longitude).trim() !== ""
              ? new Prisma.Decimal(Number(plotItem.longitude))
              : null,
          demoPlotId,
        },
      });

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
          type13Id: t13.id,
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
 * Synchronizes ActivityPlanType13 records when updating an ActivityPlan
 */
export async function syncType13Data(
  tx: Prisma.TransactionClient,
  planId: string,
  type13Data: Type13DataInput | undefined | null,
  startDate: Date,
  employeeId: string,
) {
  if (type13Data === undefined) return;

  await tx.activityPlanType13.deleteMany({
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
  return db.activityPlanType13.findUnique({
    where: { activityPlanId: planId },
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
  });
}
