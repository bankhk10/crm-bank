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
 * Sync Type 7A plots and products directly into DemoPlot and DemoPlotProduct
 */
export async function syncType7aPlots(
  tx: Prisma.TransactionClient,
  activityPlanId: string,
  rawPlots: Type7aPlotInput[],
  startDate: Date = new Date(),
  employeeId: string = "",
): Promise<void> {
  if (!rawPlots || rawPlots.length === 0) return;

  // Clean up previous dual-sync calendar/dashboard records
  await tx.activityPlanStore.deleteMany({
    where: { activityPlanId, workTypeCode: "TYPE_7A" },
  });
  await tx.activityPlanProduct.deleteMany({
    where: { activityPlanId, workTypeCode: "TYPE_7A" },
  });

  // Find existing DemoPlots attached to this activity plan
  const existingPlots = await tx.demoPlot.findMany({
    where: { activityPlanId },
    select: { id: true, code: true },
  });
  const existingPlotMap = new Map(existingPlots.map((p) => [p.id, p]));
  const processedPlotIds = new Set<string>();

  for (let i = 0; i < rawPlots.length; i++) {
    const plot = rawPlots[i];
    let demoPlotId =
      plot.demoPlotId ||
      (plot.id && existingPlotMap.has(plot.id) ? plot.id : null);

    const prods = (plot.demoProducts || plot.products || []).filter((prod) =>
      Boolean(prod.productId),
    );
    const categoryId =
      plot.categoryId ||
      prods.find((p) => p.categoryId)?.categoryId ||
      null;

    const plotName = plot.plotName || plot.name || "แปลงสาธิต";
    const ownerName = plot.ownerName || plot.farmerName || "";

    if (!demoPlotId || !existingPlotMap.has(demoPlotId)) {
      const code = await generateDemoPlotCode(tx, startDate, i);
      const createdPlot = await tx.demoPlot.create({
        data: {
          code,
          activityPlanId,
          name: plotName,
          ownerName,
          customerId: plot.storeId || null,
          employeeId: employeeId || "system",
          province: plot.province || null,
          district: plot.district || null,
          cropCategory: plot.cropCategory || "พืชทั่วไป",
          cropName: plot.cropName || "พืชทั่วไป",
          customCropName: plot.customCropName || null,
          areaRai:
            plot.areaRai != null
              ? new Prisma.Decimal(plot.areaRai)
              : null,
          treeCount:
            plot.treeCount != null
              ? Number(plot.treeCount)
              : null,
          startDate: plot.plantingDate ? new Date(plot.plantingDate) : startDate,
          initialSprayDate: plot.initialSprayDate
            ? new Date(plot.initialSprayDate)
            : null,
          nextSprayDate: plot.nextSprayDate
            ? new Date(plot.nextSprayDate)
            : null,
          objective: plot.objective || null,
          categoryId,
          hasProducts: prods.length > 0,
          notes: plot.notes || null,
          latitude: parseDecimalCoord(plot.latitude),
          longitude: parseDecimalCoord(plot.longitude),
          status: DemoPlotStatus.IN_PROGRESS,
        },
      });
      demoPlotId = createdPlot.id;
    } else {
      await tx.demoPlot.update({
        where: { id: demoPlotId },
        data: {
          name: plotName,
          ownerName,
          customerId: plot.storeId || null,
          province: plot.province || null,
          district: plot.district || null,
          cropCategory: plot.cropCategory || "พืชทั่วไป",
          cropName: plot.cropName || "พืชทั่วไป",
          customCropName: plot.customCropName || null,
          areaRai:
            plot.areaRai != null
              ? new Prisma.Decimal(plot.areaRai)
              : null,
          treeCount:
            plot.treeCount != null
              ? Number(plot.treeCount)
              : null,
          objective: plot.objective || null,
          categoryId,
          hasProducts: prods.length > 0,
          notes: plot.notes || null,
        },
      });
    }

    processedPlotIds.add(demoPlotId);

    // Save planned products directly into DemoPlotProduct
    await tx.demoPlotProduct.deleteMany({
      where: { demoPlotId, isAdditional: false },
    });

    if (prods.length > 0) {
      const rawProductKeys = prods.map((p) => p.productId!).filter(Boolean);
      const productMap = new Map<string, { id: string; name: string }>();

      if ((tx as any).product?.findMany && rawProductKeys.length > 0) {
        const matchedProducts = await (tx as any).product.findMany({
          where: {
            OR: [
              { id: { in: rawProductKeys } },
              { name: { in: rawProductKeys } },
              { productCode: { in: rawProductKeys } },
            ],
          },
          select: { id: true, name: true },
        });
        for (const dp of matchedProducts) {
          productMap.set(dp.id, dp);
          productMap.set(dp.name, dp);
        }
      }

      const validProductsToCreate: any[] = [];
      prods.forEach((prod, pIdx) => {
        let finalId = prod.productId!;
        let finalName = prod.productName || null;

        if ((tx as any).product?.findMany) {
          const matched = productMap.get(prod.productId!);
          if (!matched) return; // Skip invalid foreign key
          finalId = matched.id;
          finalName = prod.productName || matched.name;
        }

        const qty = prod.quantity ?? prod.targetQuantity ?? 1;
        validProductsToCreate.push({
          demoPlotId,
          productId: finalId,
          productName: finalName,
          applicationRate: prod.applicationRate || "",
          quantity: new Prisma.Decimal(qty),
          withdrawnQuantity: new Prisma.Decimal(qty),
          unit: prod.unit || "ขวด",
          sortOrder: pIdx,
          isAdditional: false,
        });
      });

      if (validProductsToCreate.length > 0) {
        await tx.demoPlotProduct.createMany({
          data: validProductsToCreate,
        });
      }
    }

    // Dual-sync to ActivityPlanStore for unified schedule queries
    const storeName = ownerName || plotName || "แปลงสาธิต";
    await tx.activityPlanStore.create({
      data: {
        activityPlanId,
        storeId: plot.storeId || null,
        storeName,
        workTypeCode: "TYPE_7A",
        notes: plot.objective || plot.notes || null,
      },
    });

    // Dual-sync products to ActivityPlanProduct
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

  // Delete any plots that belonged to this activityPlanId but were removed
  for (const existing of existingPlots) {
    if (!processedPlotIds.has(existing.id)) {
      await tx.demoPlot.delete({
        where: { id: existing.id },
      });
    }
  }
}

/**
 * Find Type 7A data by Plan ID directly from DemoPlot
 */
export async function findType7aByPlanId(activityPlanId: string) {
  const [type7aPlots, stores, products] = await Promise.all([
    db.demoPlot.findMany({
      where: { activityPlanId },
      include: {
        customer: true,
        farmerCustomer: true,
        irrigations: true,
        externalProducts: {
          orderBy: { sortOrder: "asc" },
        },
        demoProducts: {
          include: { product: true },
          orderBy: { sortOrder: "asc" },
        },
        visits: {
          orderBy: [{ visitNumber: "asc" }, { createdAt: "asc" }],
        },
        attachments: true,
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

/**
 * Sync Type 7A Actual outcome data to DemoPlot, DemoPlotIrrigation,
 * DemoPlotExternalProduct, DemoPlotProduct, and DemoPlotVisit (Visit #1)
 */
export async function syncType7aActualData(
  tx: Prisma.TransactionClient,
  activityPlanId: string,
  actualData: any,
): Promise<void> {
  if (!actualData) return;

  let demoPlotId = actualData.demoPlotId || actualData.t7DemoPlotId || null;

  if (!demoPlotId) {
    const matchedPlot = await tx.demoPlot.findFirst({
      where: { activityPlanId },
      select: { id: true },
    });
    if (matchedPlot?.id) {
      demoPlotId = matchedPlot.id;
    }
  }

  if (!demoPlotId) {
    const firstPlot = actualData.type7aPlots?.[0];
    if (firstPlot?.demoPlotId) {
      demoPlotId = firstPlot.demoPlotId;
    } else if (firstPlot?.id && firstPlot.id !== "plot-0") {
      const checkPlot = await tx.demoPlot.findUnique({
        where: { id: firstPlot.id },
        select: { id: true },
      });
      if (checkPlot?.id) {
        demoPlotId = checkPlot.id;
      }
    }
  }

  // Fallback: If DemoPlot was never created for this plan, create one
  if (!demoPlotId) {
    const code = await generateDemoPlotCode(tx);
    const createdPlot = await tx.demoPlot.create({
      data: {
        code,
        activityPlanId,
        name: actualData.t7PlotName || "แปลงสาธิต",
        ownerName: actualData.t7FarmerName || "",
        employeeId: "system",
        status: DemoPlotStatus.IN_PROGRESS,
        startDate: actualData.t7PlantingDate ? new Date(actualData.t7PlantingDate) : new Date(),
      },
    });
    demoPlotId = createdPlot.id;
  }

  // 1. Update Master DemoPlot record
  await tx.demoPlot.update({
    where: { id: demoPlotId },
    data: {
      name: actualData.t7PlotName || undefined,
      ownerName: actualData.t7FarmerName || undefined,
      farmerCustomerId: actualData.t7FarmerCustomerId || null,
      ownerPhone: actualData.t7FarmerPhone || null,
      ownerProvince: actualData.t7FarmerProvince || null,
      ownerDistrict: actualData.t7FarmerDistrict || null,
      ownerSubdistrict: actualData.t7FarmerSubdistrict || null,
      isUnregisteredFarmer: Boolean(actualData.t7IsUnregisteredFarmer),
      latitude: parseDecimalCoord(actualData.t7Latitude),
      longitude: parseDecimalCoord(actualData.t7Longitude),
      cropCategory: actualData.t7CropCategory || undefined,
      cropName: actualData.t7CropName || undefined,
      customCropName: actualData.t7CustomCropName || undefined,
      areaRai:
        actualData.t7AreaRai != null && actualData.t7AreaRai !== ""
          ? new Prisma.Decimal(actualData.t7AreaRai)
          : undefined,
      treeCount:
        actualData.t7TreeCount != null && actualData.t7TreeCount !== ""
          ? Number(actualData.t7TreeCount)
          : undefined,
      objective: actualData.t7PlotObjective || undefined,
      mainCropInfo: actualData.t7MainCropInfo || null,
      experimentDetail: actualData.t7ExperimentDetail || null,
      plantingDate: actualData.t7PlantingDate ? new Date(actualData.t7PlantingDate) : null,
      initialSprayDate: actualData.t7InitialSprayDate ? new Date(actualData.t7InitialSprayDate) : null,
      nextSprayDate: actualData.t7NextSprayDate ? new Date(actualData.t7NextSprayDate) : null,
      sprayMethod: actualData.t7SprayMethod || null,
      sprayEquipment: actualData.t7SprayEquipment || null,
      otherEquipment: actualData.t7OtherEquipment || null,
      hasExternalChemicals: Boolean(actualData.t7HasExternalChemicals),
      notes: actualData.t7Notes || null,
    },
  });

  // 2. Sync DemoPlotIrrigation
  await tx.demoPlotIrrigation.deleteMany({
    where: { demoPlotId },
  });
  if (Array.isArray(actualData.t7Irrigations) && actualData.t7Irrigations.length > 0) {
    const uniqueMethods = Array.from(new Set(actualData.t7Irrigations.filter(Boolean)));
    if (uniqueMethods.length > 0) {
      await tx.demoPlotIrrigation.createMany({
        data: uniqueMethods.map((m: any) => ({
          demoPlotId,
          method: String(m),
        })),
      });
    }
  }

  // 3. Sync DemoPlotExternalProduct
  await tx.demoPlotExternalProduct.deleteMany({
    where: { demoPlotId },
  });
  if (
    actualData.t7HasExternalChemicals &&
    Array.isArray(actualData.t7ExternalProducts) &&
    actualData.t7ExternalProducts.length > 0
  ) {
    const validExternals = actualData.t7ExternalProducts.filter((p: any) =>
      Boolean(p.productName?.trim()),
    );
    if (validExternals.length > 0) {
      await tx.demoPlotExternalProduct.createMany({
        data: validExternals.map((ext: any, idx: number) => ({
          demoPlotId,
          company: ext.company || "",
          productName: ext.productName,
          activeIngredient: ext.activeIngredient || null,
          formula: ext.formula || "SL",
          customFormula: ext.customFormula || null,
          applicationRate: ext.applicationRate || "",
          sortOrder: idx,
        })),
      });
    }
  }

  // 4. Sync DemoPlotProduct (Planned + Additional)
  await tx.demoPlotProduct.deleteMany({
    where: { demoPlotId },
  });

  // Resolve and validate candidate products against DB to guarantee FK integrity
  const rawCandidateKeys: string[] = [
    ...(actualData.t7PlannedProducts || []).map((p: any) => p.productId).filter(Boolean),
    ...(actualData.t7AdditionalProducts || []).map((p: any) => p.productId).filter(Boolean),
  ];

  const productMap = new Map<string, { id: string; name: string }>();
  if ((tx as any).product?.findMany && rawCandidateKeys.length > 0) {
    const matchedProducts = await (tx as any).product.findMany({
      where: {
        OR: [
          { id: { in: rawCandidateKeys } },
          { name: { in: rawCandidateKeys } },
          { productCode: { in: rawCandidateKeys } },
        ],
      },
      select: { id: true, name: true },
    });
    for (const prod of matchedProducts) {
      productMap.set(prod.id, prod);
      productMap.set(prod.name, prod);
    }
  }

  const productsToCreate: any[] = [];

  // Planned products
  if (Array.isArray(actualData.t7PlannedProducts) && actualData.t7PlannedProducts.length > 0) {
    actualData.t7PlannedProducts.forEach((p: any, idx: number) => {
      if (!p.productId) return;
      let finalProductId = p.productId;
      let finalProductName = p.productName || null;

      if ((tx as any).product?.findMany) {
        const matched = productMap.get(p.productId);
        if (!matched) return; // Skip invalid foreign key to prevent DB crash
        finalProductId = matched.id;
        finalProductName = p.productName || matched.name;
      }

      productsToCreate.push({
        demoPlotId,
        productId: finalProductId,
        productName: finalProductName,
        quantity:
          p.actualQuantity != null && p.actualQuantity !== ""
            ? new Prisma.Decimal(p.actualQuantity)
            : null,
        extraQuantity:
          p.extraQuantity != null && p.extraQuantity !== ""
            ? new Prisma.Decimal(p.extraQuantity)
            : null,
        extraUnit: p.extraUnit || null,
        applicationRate: p.applicationRate || "",
        isAdditional: false,
        withdrawnQuantity:
          p.withdrawnQuantity != null && p.withdrawnQuantity !== ""
            ? new Prisma.Decimal(p.withdrawnQuantity)
            : null,
        unit: p.unit || null,
        sortOrder: idx,
      });
    });
  }

  // Additional products
  if (Array.isArray(actualData.t7AdditionalProducts) && actualData.t7AdditionalProducts.length > 0) {
    actualData.t7AdditionalProducts.forEach((p: any, idx: number) => {
      if (!p.productId) return;
      let finalProductId = p.productId;
      let finalProductName = p.productName || null;

      if ((tx as any).product?.findMany) {
        const matched = productMap.get(p.productId);
        if (!matched) return; // Skip invalid foreign key to prevent DB crash
        finalProductId = matched.id;
        finalProductName = p.productName || matched.name;
      }

      productsToCreate.push({
        demoPlotId,
        productId: finalProductId,
        productName: finalProductName,
        quantity:
          p.actualQuantity != null && p.actualQuantity !== ""
            ? new Prisma.Decimal(p.actualQuantity)
            : null,
        extraQuantity:
          p.extraQuantity != null && p.extraQuantity !== ""
            ? new Prisma.Decimal(p.extraQuantity)
            : null,
        extraUnit: p.extraUnit || null,
        applicationRate: p.applicationRate || "",
        isAdditional: true,
        unit: p.unit || null,
        sortOrder: productsToCreate.length + idx,
      });
    });
  }

  if (productsToCreate.length > 0) {
    await tx.demoPlotProduct.createMany({
      data: productsToCreate,
    });
  }

  // 5. Sync DemoPlotVisit (Visit #1)
  const photoUrls = (actualData.t7InitialPhotos || [])
    .map((img: any) => img.url)
    .filter(Boolean);

  const visitNumber = 1;
  const visitDate = actualData.t7InitialSprayDate
    ? new Date(actualData.t7InitialSprayDate)
    : new Date();
  const cropAgeVal =
    actualData.t7CropAgeValue != null &&
    actualData.t7CropAgeValue !== "" &&
    !isNaN(Number(actualData.t7CropAgeValue))
      ? Number(actualData.t7CropAgeValue)
      : null;

  const existingVisit = await tx.demoPlotVisit.findFirst({
    where: {
      demoPlotId,
      activityPlanId,
      workTypeCode: "TYPE_7A",
    },
  });

  const visitData = {
    visitNumber,
    visitDate,
    daysSinceStart: 0,
    cropAgeValue: cropAgeVal,
    cropAgeUnit: actualData.t7CropAgeUnit || "วัน",
    growthStage: actualData.t7GrowthStage || null,
    sprayMethod: actualData.t7SprayMethod || null,
    sprayEquipment: actualData.t7SprayEquipment || null,
    otherEquipment: actualData.t7OtherEquipment || null,
    plotImageUrls: photoUrls,
    imageUrls: photoUrls,
    notes: actualData.t7Notes || null,
  };

  if (existingVisit) {
    await tx.demoPlotVisit.update({
      where: { id: existingVisit.id },
      data: visitData,
    });
  } else {
    await tx.demoPlotVisit.create({
      data: {
        demoPlotId,
        activityPlanId,
        workTypeCode: "TYPE_7A",
        ...visitData,
      },
    });
  }
}
