import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus } from "@prisma/client";
import { generateDemoPlotCode } from "./activity-plan.repository";

export interface Type7aPlotInput {
  id?: string;
  demoPlotId?: string | null;
  name?: string | null;
  plotName?: string | null;
  farmerName?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  storeId?: string | null;
  province?: string | null;
  district?: string | null;
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
  latitude?: string | number | null;
  longitude?: string | number | null;
  categoryId?: string | null;
  chemicalGroupId?: string | null;
  hasProducts?: boolean;
  demoProducts?: Array<{
    productId: string;
    productName?: string | null;
    quantity?: number | null;
    targetQuantity?: number | null;
    unit?: string | null;
    notes?: string | null;
  }>;
  products?: Array<{
    productId: string;
    productName?: string | null;
    quantity?: number | null;
    targetQuantity?: number | null;
    unit?: string | null;
    notes?: string | null;
  }>;
}

/**
 * Creates ActivityPlanType7a records, products, and associated DemoPlot + Visit within a Prisma Transaction
 */
export async function createType7aPlots(
  tx: Prisma.TransactionClient,
  planId: string,
  type7aPlots: Type7aPlotInput[],
  startDate: Date,
  employeeId: string,
) {
  if (!type7aPlots || type7aPlots.length === 0) return;

  for (let i = 0; i < type7aPlots.length; i++) {
    const plotItem = type7aPlots[i];
    let demoPlotId = plotItem.demoPlotId || null;

    if (!demoPlotId) {
      const code = await generateDemoPlotCode(
        tx,
        startDate ? new Date(startDate) : new Date(),
        i,
      );
      const demoPlot = await tx.demoPlot.create({
        data: {
          code,
          name: plotItem.name || plotItem.plotName || "แปลงสาธิต",
          ownerName: plotItem.ownerName || plotItem.farmerName || "",
          customerId: plotItem.storeId || null,
          employeeId,
          province: plotItem.province || null,
          district: plotItem.district || null,
          cropCategory: plotItem.cropCategory || "พืชทั่วไป",
          cropName: plotItem.cropName || "พืชทั่วไป",
          customCropName: plotItem.customCropName || null,
          areaRai:
            plotItem.areaRai != null
              ? new Prisma.Decimal(plotItem.areaRai)
              : null,
          treeCount: plotItem.treeCount || null,
          plantingDate: plotItem.plantingDate
            ? new Date(plotItem.plantingDate)
            : null,
          initialSprayDate: plotItem.initialSprayDate
            ? new Date(plotItem.initialSprayDate)
            : null,
          nextSprayDate: plotItem.nextSprayDate
            ? new Date(plotItem.nextSprayDate)
            : null,
          objective: plotItem.objective || null,
          notes: plotItem.notes || null,
          latitude:
            plotItem.latitude != null
              ? new Prisma.Decimal(Number(plotItem.latitude))
              : null,
          longitude:
            plotItem.longitude != null
              ? new Prisma.Decimal(Number(plotItem.longitude))
              : null,
          plotType: "GENERAL_DEMO",
          startDate,
          status: DemoPlotStatus.IN_PROGRESS,
        },
      });
      demoPlotId = demoPlot.id;
    }

    const t7a = await tx.activityPlanType7a.create({
      data: {
        activityPlanId: planId,
        demoPlotId,
        plotName: plotItem.plotName || plotItem.name || "แปลงสาธิต",
        storeId: plotItem.storeId || null,
        ownerName: plotItem.ownerName || plotItem.farmerName || null,
        province: plotItem.province || null,
        district: plotItem.district || null,
        cropCategory: plotItem.cropCategory || "พืชทั่วไป",
        cropName: plotItem.cropName || "พืชทั่วไป",
        customCropName: plotItem.customCropName || null,
        areaRai:
          plotItem.areaRai != null
            ? new Prisma.Decimal(plotItem.areaRai)
            : null,
        treeCount: plotItem.treeCount || null,
        objective: plotItem.objective || "",
        categoryId: plotItem.categoryId || plotItem.chemicalGroupId || null,
        hasProducts: Boolean(
          (plotItem.products && plotItem.products.length > 0) ||
            (plotItem.demoProducts && plotItem.demoProducts.length > 0),
        ),
      },
    });

    const productsList = plotItem.products || plotItem.demoProducts;
    if (productsList && productsList.length > 0) {
      const prodIds = productsList
        .map((p) => p.productId)
        .filter(Boolean);
      const dbProducts =
        prodIds.length > 0
          ? await tx.product.findMany({
              where: { id: { in: prodIds } },
              select: { id: true, name: true, unit: true },
            })
          : [];
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      await tx.activityPlanType7aProduct.createMany({
        data: productsList.map((p, idx) => {
          const dbProd = p.productId ? productMap.get(p.productId) : undefined;
          return {
            type7aId: t7a.id,
            productId: p.productId,
            productName: p.productName || dbProd?.name || null,
            quantity:
              p.quantity != null
                ? new Prisma.Decimal(p.quantity)
                : p.targetQuantity != null
                  ? new Prisma.Decimal(p.targetQuantity)
                  : new Prisma.Decimal(1),
            unit: p.unit || dbProd?.unit || null,
            sortOrder: idx,
          };
        }),
      });
    }

    if (demoPlotId) {
      const existingVisit = await tx.demoPlotVisit.findFirst({
        where: {
          activityPlanId: planId,
          demoPlotId,
          workTypeCode: "TYPE_7A",
        },
      });
      if (!existingVisit) {
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId,
            activityPlanId: planId,
            workTypeCode: "TYPE_7A",
            visitNumber: 1,
            visitDate: startDate,
          },
        });
      }
    }
  }
}

/**
 * Synchronizes ActivityPlanType7a records when updating an ActivityPlan
 */
export async function syncType7aPlots(
  tx: Prisma.TransactionClient,
  planId: string,
  type7aPlots: Type7aPlotInput[] | undefined,
  startDate: Date,
  employeeId: string,
) {
  if (type7aPlots === undefined) return;

  await tx.activityPlanType7a.deleteMany({
    where: { activityPlanId: planId },
  });

  if (type7aPlots && type7aPlots.length > 0) {
    for (let i = 0; i < type7aPlots.length; i++) {
      const plotItem = type7aPlots[i];
      let demoPlotId = plotItem.demoPlotId || null;

      if (!demoPlotId) {
        const code = await generateDemoPlotCode(
          tx,
          startDate ? new Date(startDate) : new Date(),
          i,
        );
        const demoPlot = await tx.demoPlot.create({
          data: {
            code,
            name: plotItem.plotName || plotItem.name || "แปลงสาธิต",
            ownerName: plotItem.ownerName || plotItem.farmerName || "",
            customerId: plotItem.storeId || null,
            employeeId,
            province: plotItem.province || null,
            district: plotItem.district || null,
            cropCategory: plotItem.cropCategory || "พืชทั่วไป",
            cropName: plotItem.cropName || "พืชทั่วไป",
            customCropName: plotItem.customCropName || null,
            areaRai:
              plotItem.areaRai != null
                ? new Prisma.Decimal(plotItem.areaRai)
                : null,
            treeCount: plotItem.treeCount || null,
            plantingDate: plotItem.plantingDate
              ? new Date(plotItem.plantingDate)
              : null,
            initialSprayDate: plotItem.initialSprayDate
              ? new Date(plotItem.initialSprayDate)
              : null,
            nextSprayDate: plotItem.nextSprayDate
              ? new Date(plotItem.nextSprayDate)
              : null,
            objective: plotItem.objective || null,
            notes: plotItem.notes || null,
            latitude:
              plotItem.latitude != null
                ? new Prisma.Decimal(Number(plotItem.latitude))
                : null,
            longitude:
              plotItem.longitude != null
                ? new Prisma.Decimal(Number(plotItem.longitude))
                : null,
            plotType: "GENERAL_DEMO",
            startDate,
            status: DemoPlotStatus.IN_PROGRESS,
          },
        });
        demoPlotId = demoPlot.id;
      }

      const t7a = await tx.activityPlanType7a.create({
        data: {
          activityPlanId: planId,
          demoPlotId,
          plotName: plotItem.plotName || plotItem.name || "แปลงสาธิต",
          storeId: plotItem.storeId || null,
          ownerName: plotItem.ownerName || plotItem.farmerName || null,
          province: plotItem.province || null,
          district: plotItem.district || null,
          cropCategory: plotItem.cropCategory || "พืชทั่วไป",
          cropName: plotItem.cropName || "พืชทั่วไป",
          customCropName: plotItem.customCropName || null,
          areaRai:
            plotItem.areaRai != null
              ? new Prisma.Decimal(plotItem.areaRai)
              : null,
          treeCount: plotItem.treeCount || null,
          objective: plotItem.objective || "",
          categoryId: plotItem.categoryId || plotItem.chemicalGroupId || null,
          hasProducts: Boolean(
            (plotItem.products && plotItem.products.length > 0) ||
              (plotItem.demoProducts && plotItem.demoProducts.length > 0),
          ),
        },
      });

      const productsList = plotItem.products || plotItem.demoProducts;
      if (productsList && productsList.length > 0) {
        const prodIds = productsList
          .map((p) => p.productId)
          .filter(Boolean);
        const dbProducts =
          prodIds.length > 0
            ? await tx.product.findMany({
                where: { id: { in: prodIds } },
                select: { id: true, name: true, unit: true },
              })
            : [];
        const productMap = new Map(dbProducts.map((p) => [p.id, p]));

        await tx.activityPlanType7aProduct.createMany({
          data: productsList.map((p, idx) => {
            const dbProd = p.productId ? productMap.get(p.productId) : undefined;
            return {
              type7aId: t7a.id,
              productId: p.productId,
              productName: p.productName || dbProd?.name || null,
              quantity:
                p.quantity != null
                  ? new Prisma.Decimal(p.quantity)
                  : p.targetQuantity != null
                    ? new Prisma.Decimal(p.targetQuantity)
                    : new Prisma.Decimal(1),
              unit: p.unit || dbProd?.unit || null,
              sortOrder: idx,
            };
          }),
        });
      }

      if (demoPlotId) {
        const existingVisit = await tx.demoPlotVisit.findFirst({
          where: {
            activityPlanId: planId,
            demoPlotId,
            workTypeCode: "TYPE_7A",
          },
        });
        if (!existingVisit) {
          await tx.demoPlotVisit.create({
            data: {
              demoPlotId,
              activityPlanId: planId,
              workTypeCode: "TYPE_7A",
              visitNumber: 1,
              visitDate: startDate,
            },
          });
        }
      }
    }
  }
}

/**
 * Fetch TYPE_7A records with relations for a given plan
 */
export async function findType7aByPlanId(planId: string) {
  return db.activityPlanType7a.findMany({
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
