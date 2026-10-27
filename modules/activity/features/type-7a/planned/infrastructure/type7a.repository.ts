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
 * Now tracks directly against activity_type_7a_targets table
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

  const existingPlots = await (tx as any).activityPlanType7aTarget.findMany({
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
 * Sync Type 7A plots and products directly into 100% Dedicated
 * ActivityPlanType7aTarget & ActivityPlanType7aProduct tables (Zero Dual-Write)
 */
export async function syncType7aPlots(
  tx: Prisma.TransactionClient,
  activityPlanId: string,
  rawPlots: Type7aPlotInput[],
  startDate: Date = new Date(),
  _employeeId: string = "",
): Promise<void> {
  if (!rawPlots || rawPlots.length === 0) return;

  // Clean up existing dedicated targets & products for this plan
  await (tx as any).activityPlanType7aProduct.deleteMany({
    where: { activityPlanId },
  });
  await (tx as any).activityPlanType7aTarget.deleteMany({
    where: { activityPlanId },
  });

  for (let i = 0; i < rawPlots.length; i++) {
    const plot = rawPlots[i];
    const prods = (plot.demoProducts || plot.products || []).filter((prod) =>
      Boolean(prod.productId),
    );
    const categoryId =
      plot.categoryId ||
      prods.find((p) => p.categoryId)?.categoryId ||
      null;

    const plotName = plot.plotName || plot.name || "แปลงสาธิต";
    const code = plot.code || (await generateDemoPlotCode(tx, startDate, i));

    // Create Dedicated ActivityPlanType7aTarget
    const createdTarget = await (tx as any).activityPlanType7aTarget.create({
      data: {
        activityPlanId,
        code,
        status: DemoPlotStatus.IN_PROGRESS,
        plotName,
        storeId: plot.storeId || null,
        dealerName: plot.dealerName || null,
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
        notes: plot.notes || null,
      },
    });

    if (prods.length > 0) {
      const rawProductKeys = prods.map((p) => p.productId!).filter(Boolean);
      const productMap = new Map<string, { id: string; name: string }>();

      if (rawProductKeys.length > 0) {
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

      const dedicatedProductsToCreate: any[] = [];

      prods.forEach((prod, pIdx) => {
        let finalId = prod.productId!;
        let finalName = prod.productName || null;

        const matched = productMap.get(prod.productId!);
        if (!matched) return; // Skip invalid foreign key
        finalId = matched.id;
        finalName = prod.productName || matched.name;

        const qty = prod.quantity ?? prod.targetQuantity ?? 1;

        dedicatedProductsToCreate.push({
          activityPlanId,
          targetId: createdTarget.id,
          productId: finalId,
          productName: finalName,
          quantity: new Prisma.Decimal(qty),
          unit: prod.unit || "ขวด",
          sortOrder: pIdx,
        });
      });

      if (dedicatedProductsToCreate.length > 0) {
        await (tx as any).activityPlanType7aProduct.createMany({
          data: dedicatedProductsToCreate,
        });
      }
    }
  }
}

/**
 * Find Type 7A data by Plan ID directly from dedicated tables
 */
export async function findType7aByPlanId(activityPlanId: string) {
  const [targets, products, results] = await Promise.all([
    db.activityPlanType7aTarget.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        products: {
          include: { product: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.activityPlanType7aProduct.findMany({
      where: { activityPlanId },
      include: { product: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.activityResultType7a.findMany({
      where: { activityPlanId },
      include: {
        irrigations: true,
        actualProducts: {
          include: { product: true },
          orderBy: { sortOrder: "asc" },
        },
        sprayExternals: {
          orderBy: { sortOrder: "asc" },
        },
        attachments: true,
      },
    }),
  ]);

  return {
    type7aPlots: targets,
    targets,
    products,
    results,
    stores: [],
  };
}

/**
 * Sync Type 7A Actual outcome data exclusively into dedicated tables:
 * ActivityResultType7a, ActivityResultType7aIrrigation,
 * ActivityResultType7aProduct, ActivityResultType7aExternal, and ActivityAttachment
 */
export async function syncType7aActualData(
  tx: Prisma.TransactionClient,
  activityPlanId: string,
  actualData: any,
): Promise<void> {
  if (!actualData) return;

  // Resolve target for this plan
  const target = await tx.activityPlanType7aTarget.findFirst({
    where: { activityPlanId },
    select: { id: true },
  });

  let targetId = actualData.targetId || actualData.type7aTargetId || target?.id || null;

  // If no target exists yet, create one
  if (!targetId) {
    const code = await generateDemoPlotCode(tx);
    const createdTarget = await tx.activityPlanType7aTarget.create({
      data: {
        activityPlanId,
        code,
        status: DemoPlotStatus.IN_PROGRESS,
        plotName: actualData.t7PlotName || "แปลงสาธิต",
        cropCategory: actualData.t7CropCategory || "พืชทั่วไป",
        cropName: actualData.t7CropName || "พืชทั่วไป",
        customCropName: actualData.t7CustomCropName || null,
        areaRai:
          actualData.t7AreaRai != null && actualData.t7AreaRai !== ""
            ? new Prisma.Decimal(actualData.t7AreaRai)
            : null,
        treeCount:
          actualData.t7TreeCount != null && actualData.t7TreeCount !== ""
            ? Number(actualData.t7TreeCount)
            : null,
        objective: actualData.t7PlotObjective || null,
        notes: actualData.t7Notes || null,
      },
    });
    targetId = createdTarget.id;
  }

  // Collect candidate product keys
  const rawCandidateKeys: string[] = [
    ...(actualData.t7PlannedProducts || []).map((p: any) => p.productId).filter(Boolean),
    ...(actualData.t7AdditionalProducts || []).map((p: any) => p.productId).filter(Boolean),
  ];

  const productMap = new Map<string, { id: string; name: string }>();
  if (rawCandidateKeys.length > 0) {
    const matchedProducts = await tx.product.findMany({
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

  const dedicatedActualProducts: any[] = [];

  // Planned products
  if (Array.isArray(actualData.t7PlannedProducts) && actualData.t7PlannedProducts.length > 0) {
    actualData.t7PlannedProducts.forEach((p: any, idx: number) => {
      if (!p.productId) return;
      let finalProductId = p.productId;
      let finalProductName = p.productName || null;

      const matched = productMap.get(p.productId);
      if (!matched) return;
      finalProductId = matched.id;
      finalProductName = p.productName || matched.name;

      dedicatedActualProducts.push({
        productId: finalProductId,
        productName: finalProductName,
        isPlanned: true,
        withdrawnQuantity:
          p.withdrawnQuantity != null && p.withdrawnQuantity !== ""
            ? new Prisma.Decimal(p.withdrawnQuantity)
            : null,
        actualQuantity:
          p.actualQuantity != null && p.actualQuantity !== ""
            ? new Prisma.Decimal(p.actualQuantity)
            : new Prisma.Decimal(0),
        extraQuantity:
          p.extraQuantity != null && p.extraQuantity !== ""
            ? new Prisma.Decimal(p.extraQuantity)
            : null,
        extraUnit: p.extraUnit || null,
        actualRate: p.applicationRate || "",
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

      const matched = productMap.get(p.productId);
      if (!matched) return;
      finalProductId = matched.id;
      finalProductName = p.productName || matched.name;

      dedicatedActualProducts.push({
        productId: finalProductId,
        productName: finalProductName,
        isPlanned: false,
        withdrawnQuantity: null,
        actualQuantity:
          p.actualQuantity != null && p.actualQuantity !== ""
            ? new Prisma.Decimal(p.actualQuantity)
            : new Prisma.Decimal(0),
        extraQuantity:
          p.extraQuantity != null && p.extraQuantity !== ""
            ? new Prisma.Decimal(p.extraQuantity)
            : null,
        extraUnit: p.extraUnit || null,
        actualRate: p.applicationRate || "",
        unit: p.unit || null,
        sortOrder: dedicatedActualProducts.length + idx,
      });
    });
  }

  const cropAgeVal =
    actualData.t7CropAgeValue != null &&
    actualData.t7CropAgeValue !== "" &&
    !isNaN(Number(actualData.t7CropAgeValue))
      ? Number(actualData.t7CropAgeValue)
      : null;

  // 1. Save Dedicated ActivityResultType7a record
  await tx.activityResultType7a.deleteMany({
    where: { activityPlanId },
  });

  const createdResult = await tx.activityResultType7a.create({
    data: {
      activityPlanId,
      targetId,
      farmerCustomerId: actualData.t7FarmerCustomerId || null,
      farmerName: actualData.t7FarmerName || null,
      farmerPhone: actualData.t7FarmerPhone || null,
      isUnregisteredFarmer: Boolean(actualData.t7IsUnregisteredFarmer),
      province: actualData.t7FarmerProvince || actualData.t7Province || null,
      district: actualData.t7FarmerDistrict || actualData.t7District || null,
      subdistrict: actualData.t7FarmerSubdistrict || null,
      latitude: parseDecimalCoord(actualData.t7Latitude),
      longitude: parseDecimalCoord(actualData.t7Longitude),
      mainCropInfo: actualData.t7MainCropInfo || null,
      experimentDetail: actualData.t7ExperimentDetail || null,
      plantingDate: actualData.t7PlantingDate ? new Date(actualData.t7PlantingDate) : null,
      firstSprayDate: actualData.t7InitialSprayDate ? new Date(actualData.t7InitialSprayDate) : null,
      nextSprayDate: actualData.t7NextSprayDate ? new Date(actualData.t7NextSprayDate) : null,
      cropAgeValue: cropAgeVal,
      cropAgeUnit: actualData.t7CropAgeUnit || "วัน",
      growthStage: actualData.t7GrowthStage || null,
      sprayMethod: actualData.t7SprayMethod || null,
      hasExternalChemicals: Boolean(actualData.t7HasExternalChemicals),
      sprayEquipment: actualData.t7SprayEquipment || null,
      otherEquipment: actualData.t7OtherEquipment || null,
      notes: actualData.t7Notes || null,
    },
  });

  // 2. Dedicated Irrigations
  if (Array.isArray(actualData.t7Irrigations) && actualData.t7Irrigations.length > 0) {
    const uniqueMethods = Array.from(new Set(actualData.t7Irrigations.filter(Boolean)));
    if (uniqueMethods.length > 0) {
      await tx.activityResultType7aIrrigation.createMany({
        data: uniqueMethods.map((m: any) => ({
          resultId: createdResult.id,
          method: String(m),
        })),
      });
    }
  }

  // 3. Dedicated Products
  if (dedicatedActualProducts.length > 0) {
    await tx.activityResultType7aProduct.createMany({
      data: dedicatedActualProducts.map((p) => ({
        resultId: createdResult.id,
        ...p,
      })),
    });
  }

  // 4. Dedicated External Chemicals
  if (
    actualData.t7HasExternalChemicals &&
    Array.isArray(actualData.t7ExternalProducts) &&
    actualData.t7ExternalProducts.length > 0
  ) {
    const validExternals = actualData.t7ExternalProducts.filter((p: any) =>
      Boolean(p.productName?.trim()),
    );
    if (validExternals.length > 0) {
      await tx.activityResultType7aExternal.createMany({
        data: validExternals.map((ext: any, idx: number) => ({
          resultId: createdResult.id,
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

  // 5. Dedicated Attachments
  const initialPhotos = actualData.t7InitialPhotos || [];
  const validPhotos = initialPhotos.filter((img: any) => img && (img.url || img.fileUrl));
  if (validPhotos.length > 0) {
    await tx.activityAttachment.createMany({
      data: validPhotos.map((img: any) => ({
        activityPlanId,
        type7aResultId: createdResult.id,
        workTypeCode: "TYPE_7A",
        category: "PLOT",
        fileUrl: img.url || img.fileUrl,
        fileName: img.name || img.fileName || "ภาพแปลงสาธิตครั้งแรก",
        fileSize: img.size || img.fileSize || 0,
        mimeType: img.type || img.mimeType || "image/jpeg",
      })),
    });
  }
}
