import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus } from "@prisma/client";
import type { Type7aPlotInput } from "../../shared/types";

function parseDecimalCoord(
  val: string | number | Prisma.Decimal | null | undefined,
): Prisma.Decimal | null {
  if (val == null) return null;
  if (val instanceof Prisma.Decimal || Prisma.Decimal.isDecimal(val)) {
    return val as Prisma.Decimal;
  }
  const str = String(val).trim();
  if (str === "" || isNaN(Number(str))) return null;
  return new Prisma.Decimal(str);
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
 * Sync Type 7A plots and products within a Prisma transaction
 */
export async function syncType7aPlots(
  tx: Prisma.TransactionClient,
  activityPlanId: string,
  rawPlots: Type7aPlotInput[],
  startDate: Date = new Date(),
  employeeId: string = "",
): Promise<void> {
  if (!rawPlots || rawPlots.length === 0) return;

  // Clean up previous plan records for idempotent updates
  if ((tx as any).activityPlanType7a) {
    await (tx as any).activityPlanType7a.deleteMany({
      where: { activityPlanId },
    });
  }
  await tx.activityPlanStore.deleteMany({
    where: { activityPlanId, workTypeCode: "TYPE_7A" },
  });
  await tx.activityPlanProduct.deleteMany({
    where: { activityPlanId, workTypeCode: "TYPE_7A" },
  });

  for (let i = 0; i < rawPlots.length; i++) {
    const plot = rawPlots[i];
    let demoPlotId = plot.demoPlotId || null;

    // 1. Create or update DemoPlot
    if (!demoPlotId) {
      const code = await generateDemoPlotCode(tx, startDate, i);
      const createdPlot = await tx.demoPlot.create({
        data: {
          code,
          name: plot.plotName || plot.name || "แปลงสาธิต",
          ownerName: plot.ownerName || plot.farmerName || "",
          customerId: plot.storeId || null,
          employeeId: employeeId || "system",
          province: plot.province || null,
          district: plot.district || null,
          cropCategory: plot.cropCategory || "พืชทั่วไป",
          cropName: plot.cropName || "พืชทั่วไป",
          customCropName: plot.customCropName || null,
          areaRai: plot.areaRai != null ? new Prisma.Decimal(plot.areaRai) : null,
          treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
          startDate: plot.plantingDate ? new Date(plot.plantingDate) : startDate,
          initialSprayDate: plot.initialSprayDate ? new Date(plot.initialSprayDate) : null,
          nextSprayDate: plot.nextSprayDate ? new Date(plot.nextSprayDate) : null,
          objective: plot.objective || null,
          notes: plot.notes || null,
          latitude: parseDecimalCoord(plot.latitude),
          longitude: parseDecimalCoord(plot.longitude),
          status: DemoPlotStatus.IN_PROGRESS,
        },
      });
      demoPlotId = createdPlot.id;
    } else {
      try {
        await tx.demoPlot.update({
          where: { id: demoPlotId },
          data: {
            name: plot.plotName || plot.name || "แปลงสาธิต",
            ownerName: plot.ownerName || plot.farmerName || "",
            customerId: plot.storeId || null,
            province: plot.province || null,
            district: plot.district || null,
            cropCategory: plot.cropCategory || "พืชทั่วไป",
            cropName: plot.cropName || "พืชทั่วไป",
            customCropName: plot.customCropName || null,
            areaRai: plot.areaRai != null ? new Prisma.Decimal(plot.areaRai) : null,
            treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
            objective: plot.objective || null,
            notes: plot.notes || null,
          },
        });
      } catch {
        // Ignore if demoPlotId was not found
      }
    }

    const prods = (plot.demoProducts || plot.products || []).filter((prod) =>
      Boolean(prod.productId),
    );

    // 2. Save to Dedicated Plan Table (ActivityPlanType7a + ActivityPlanType7aProduct)
    if ((tx as any).activityPlanType7a) {
      await (tx as any).activityPlanType7a.create({
        data: {
          activityPlanId,
          plotName: plot.plotName || plot.name || "แปลงสาธิต",
          storeId: plot.storeId || null,
          ownerName: plot.ownerName || plot.farmerName || null,
          province: plot.province || null,
          district: plot.district || null,
          cropCategory: plot.cropCategory || "พืชทั่วไป",
          cropName: plot.cropName || "พืชทั่วไป",
          customCropName: plot.customCropName || null,
          areaRai: plot.areaRai != null ? new Prisma.Decimal(plot.areaRai) : null,
          treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
          objective: plot.objective || "",
          categoryId:
            plot.categoryId ||
            prods.find((p) => p.categoryId)?.categoryId ||
            null,
          hasProducts: prods.length > 0,
          demoPlotId,
          products:
            prods.length > 0
              ? {
                  create: prods.map((prod, pIdx) => ({
                    productId: prod.productId!,
                    productName: prod.productName || null,
                    quantity: new Prisma.Decimal(
                      prod.quantity || prod.targetQuantity || 1,
                    ),
                    unit: prod.unit || "ขวด",
                    sortOrder: pIdx,
                  })),
                }
              : undefined,
        },
      });
    }

    // 3. Also dual-sync to ActivityPlanStore for unified schedule queries
    const storeName = plot.ownerName || plot.farmerName || plot.plotName || "แปลงสาธิต";
    await tx.activityPlanStore.create({
      data: {
        activityPlanId,
        storeId: plot.storeId || null,
        storeName,
        workTypeCode: "TYPE_7A",
        notes: plot.objective || plot.notes || null,
      },
    });

    // 4. Dual-sync products to ActivityPlanProduct
    if (prods.length > 0) {
      for (const prod of prods) {
        if (prod.productId) {
          await tx.activityPlanProduct.create({
            data: {
              activityPlanId,
              productId: prod.productId,
              targetQuantity:
                prod.quantity || prod.targetQuantity
                  ? Number(prod.quantity || prod.targetQuantity)
                  : 0,
              notes: prod.notes || null,
              workTypeCode: "TYPE_7A",
            },
          });
        }
      }
    }
  }
}

/**
 * Find Type 7A data by Plan ID
 */
export async function findType7aByPlanId(activityPlanId: string) {
  const [type7aPlots, stores, products] = await Promise.all([
    db.activityPlanType7a.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        demoPlot: true,
        products: {
          orderBy: { sortOrder: "asc" },
          include: { product: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.activityPlanStore.findMany({
      where: { activityPlanId, workTypeCode: "TYPE_7A" },
    }),
    db.activityPlanProduct.findMany({
      where: { activityPlanId, workTypeCode: "TYPE_7A" },
      include: { product: true },
    }),
  ]);

  return {
    type7aPlots,
    stores,
    products,
  };
}
