import type { Type7bUnplannedItem } from "../types/unplanned.types";
import type { Type7bWithdrawnProductLine } from "../../shared/types";
import type {
  Type7bSprayRoundState,
  Type7bAdditionalProductItem,
} from "../../planned/types/actual.types";
import { createDefaultSprayRound, createDefaultType7bUnplannedItem } from "../hooks/use-type7b-unplanned-form";

/**
 * Hydrates Type 7B Unplanned Form Items from initial data
 */
export function hydrateType7bUnplannedData(initialData: any): Type7bUnplannedItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type7bUnplannedItems) && initialData.type7bUnplannedItems.length > 0) {
    return initialData.type7bUnplannedItems.map((item: any) => ({
      ...item,
      visitDate: item.visitDate || new Date().toISOString().split("T")[0],
      daysAfterSpray: item.daysAfterSpray ?? 0,
      cropImages: item.cropImages || item.photos || [],
      sprayingRounds:
        Array.isArray(item.sprayingRounds) && item.sprayingRounds.length > 0
          ? item.sprayingRounds
          : [createDefaultSprayRound(1, item.visitDate)],
      plotStatus: item.plotStatus || "IN_PROGRESS",
    }));
  }

  const t7b =
    initialData.type7bTargets && initialData.type7bTargets.length > 0
      ? {
          plots: initialData.type7bTargets,
          products: initialData.type7bProducts || [],
        }
      : initialData.type7b || initialData.type7bData;
  if (!t7b) return [];

  const rawPlots: any[] = t7b.plots || [];
  const rawProducts: any[] = t7b.products || [];

  const actualOutcome = initialData.actualOutcome || initialData.actualData || {};
  const t7bActual = actualOutcome.type7bActual || actualOutcome.type7b || actualOutcome;

  const withdrawn: Type7bWithdrawnProductLine[] = rawProducts.map((p, idx) => ({
    id: p.id || String(idx + 1),
    productId: p.productId,
    productName: p.productName || p.product?.name || "",
    quantity: Number(p.quantity) || 1,
    unit: p.unit || p.product?.unit || "",
  }));

  const productsFromWithdrawn: Type7bAdditionalProductItem[] = withdrawn.map((p, idx) => ({
    id: p.id || `prod-withdrawn-${idx + 1}`,
    productId: p.productId,
    productName: p.productName,
    actualQuantity: p.quantity,
    quantityUsed: p.quantity,
    extraQuantity: "",
    extraUnit: p.unit?.includes("ซอง") ? "กรัม" : "ซีซี",
    applicationRate: "ตามคำแนะนำ",
    unit: p.unit || "ขวด",
  }));

  // Restore spray rounds from actual outcome if available
  let restoredRounds: Type7bSprayRoundState[] = [];
  if (Array.isArray(t7bActual.t7SprayingRounds) && t7bActual.t7SprayingRounds.length > 0) {
    restoredRounds = t7bActual.t7SprayingRounds.map((r: any) => ({
      ...r,
      // In unplanned, products used are placed in additionalProducts; baselineProducts is []
      baselineProducts: [],
      additionalProducts: (r.additionalProducts && r.additionalProducts.length > 0)
        ? r.additionalProducts
        : (r.baselineProducts || []),
    }));
  } else if (Array.isArray(initialData.sprayRounds) && initialData.sprayRounds.length > 0) {
    restoredRounds = initialData.sprayRounds.map((sr: any, idx: number) => ({
      id: sr.id || `round-${idx + 1}`,
      roundNumber: sr.roundNumber || idx + 1,
      sprayDate: sr.sprayDate
        ? new Date(sr.sprayDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      sprayMethod: sr.sprayMethod || "SINGLE",
      sprayEquipment: sr.sprayEquipment || "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
      otherEquipment: sr.otherEquipment || "",
      productResponse: sr.productResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
      problemDetail: sr.problemDetail || "",
      hasExternalChemicals: Boolean(sr.hasExternalChemicals || (sr.externalProducts && sr.externalProducts.length > 0)),
      externalProducts: (sr.externalProducts || []).map((ext: any) => ({
        id: ext.id,
        company: ext.company || "",
        productName: ext.productName || "",
        activeIngredient: ext.activeIngredient || "",
        formula: ext.formula || "SL",
        customFormula: ext.customFormula || "",
        applicationRate: ext.applicationRate || "",
      })),
      baselineProducts: [],
      additionalProducts: (sr.products || []).map((p: any) => ({
        id: p.id || `prod-${Math.random().toString(36).substring(2, 7)}`,
        productId: p.productId,
        productName: p.productName || p.product?.name || "",
        actualQuantity: p.actualQuantity || p.quantityUsed || 1,
        quantityUsed: p.quantityUsed || p.actualQuantity || 1,
        extraQuantity: p.extraQuantity || "",
        extraUnit: p.extraUnit || "ซีซี",
        applicationRate: p.actualRate || p.applicationRate || "",
        unit: p.unit || "ขวด",
      })),
      roundImages: [],
    }));
  }

  if (restoredRounds.length === 0) {
    const defaultRound = createDefaultSprayRound(1);
    if (productsFromWithdrawn.length > 0) {
      defaultRound.additionalProducts = productsFromWithdrawn;
    }
    restoredRounds = [defaultRound];
  }

  const visitDate =
    t7bActual.t7VisitDate ||
    (initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);

  const daysAfterSpray =
    t7bActual.t7DaysAfterSpray != null ? Number(t7bActual.t7DaysAfterSpray) : 0;

  const cropImages = t7bActual.t7CropImages || actualOutcome.attachments || [];

  if (rawPlots.length > 0) {
    return rawPlots.map((plot, idx) => ({
      id: plot.id || String(idx + 1),
      demoPlotId: plot.demoPlotId || null,
      sourceActivityPlanId: t7b.sourceActivityPlanId || null,
      plotName: plot.plotName || plot.name || "",
      farmerName: plot.ownerName || plot.farmerName || "",
      province: plot.province || "",
      district: plot.district || "",
      cropCategory: plot.cropCategory || "",
      cropName: plot.cropName || "",
      areaRai: plot.areaRai != null ? Number(plot.areaRai) : null,
      treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
      dealerName: plot.dealerName || "",
      visitDate,
      daysAfterSpray,
      cropImages,
      sprayingRounds: restoredRounds,
      nextSprayDate: t7bActual.t7NextSprayDate || "",
      notes: t7bActual.t7Notes || t7b.notes || "",
      plotStatus: t7bActual.t7PlotStatus || "IN_PROGRESS",
      finalYieldKg: t7bActual.t7FinalYieldKg || "",
      controlYieldKg: t7bActual.t7ControlYieldKg || "",
      farmerSatisfaction: t7bActual.t7FarmerSatisfaction ? Number(t7bActual.t7FarmerSatisfaction) : undefined,
      commercialPotential: t7bActual.t7CommercialPotential || "",
      finalSummaryNotes: t7bActual.t7FinalSummaryNotes || "",
      cropCondition: t7bActual.t7CropCondition || "สมบูรณ์",
      growthStage: t7bActual.t7GrowthStage || "",
      productResponse: t7bActual.t7ProductResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
      hasProductWithdrawal: withdrawn.length > 0,
      withdrawnProducts: withdrawn,
      photos: cropImages,
    }));
  }

  return [];
}

/**
 * Maps Type 7B Unplanned Items to payload for saving plan & actual outcome together
 */
export function mapType7bUnplannedToPayload(
  items: Type7bUnplannedItem[],
  allProducts: any[] = [],
) {
  if (!items || items.length === 0) {
    return {
      type7bData: null,
      actualOutcome: null,
      planProducts: [],
    };
  }

  const firstItem = items[0];
  const allPlotIds = items.map((i) => i.demoPlotId).filter(Boolean);

  const plots = items.map((item) => ({
    demoPlotId: item.demoPlotId || null,
    plotName: item.plotName || "แปลงสาธิตติดตาม",
    farmerName: item.farmerName || null,
    ownerName: item.farmerName || null,
    province: item.province || null,
    district: item.district || null,
    cropCategory: item.cropCategory || null,
    cropName: item.cropName || null,
    areaRai: item.areaRai != null ? Number(item.areaRai) : null,
    treeCount: item.treeCount != null ? Number(item.treeCount) : null,
    dealerName: item.dealerName || null,
  }));

  // Aggregate all products used across all rounds of all plots
  const productLinesMap = new Map<string, { productId: string; productName?: string; quantity: number; unit?: string }>();

  for (const item of items) {
    // 1. From rounds (baselineProducts & additionalProducts)
    for (const round of item.sprayingRounds || []) {
      for (const bp of round.baselineProducts || []) {
        if (bp.productId) {
          const qty = Number(bp.actualQuantity ?? bp.quantityUsed ?? bp.withdrawnQuantity ?? 1) || 1;
          const existing = productLinesMap.get(bp.productId);
          if (existing) {
            existing.quantity += qty;
          } else {
            productLinesMap.set(bp.productId, {
              productId: bp.productId,
              productName: bp.productName,
              quantity: qty,
              unit: bp.unit || "ขวด",
            });
          }
        }
      }

      for (const ap of round.additionalProducts || []) {
        if (ap.productId) {
          const qty = Number(ap.actualQuantity ?? ap.quantityUsed ?? 1) || 1;
          const existing = productLinesMap.get(ap.productId);
          if (existing) {
            existing.quantity += qty;
          } else {
            productLinesMap.set(ap.productId, {
              productId: ap.productId,
              productName: ap.productName,
              quantity: qty,
              unit: ap.unit || "ขวด",
            });
          }
        }
      }
    }

    // 2. From legacy withdrawnProducts if any
    if (item.hasProductWithdrawal && item.withdrawnProducts) {
      for (const wp of item.withdrawnProducts) {
        if (wp.productId && !productLinesMap.has(wp.productId)) {
          productLinesMap.set(wp.productId, {
            productId: wp.productId,
            productName: wp.productName,
            quantity: Number(wp.quantity) || 1,
            unit: wp.unit || "ขวด",
          });
        }
      }
    }
  }

  const aggregatedProducts = Array.from(productLinesMap.values());

  const planProducts = aggregatedProducts.map((p) => {
    const match = allProducts.find(
      (prod) => prod.id === p.productId || prod.name === p.productId,
    );
    return {
      workTypeCode: "TYPE_7B",
      productId: match?.id || p.productId,
      productName: p.productName || match?.name || null,
      targetQuantity: Number(p.quantity) || 1,
      isPriceOverridden: false,
    };
  });

  const type7bData = {
    sourceActivityPlanId: firstItem.sourceActivityPlanId || null,
    demoPlotId: firstItem.demoPlotId || allPlotIds[0] || null,
    notes: firstItem.notes || firstItem.objective || null,
    objective: firstItem.objective || firstItem.notes || null,
    plots,
    products: aggregatedProducts.map((p) => {
      const match = allProducts.find(
        (prod) => prod.id === p.productId || prod.name === p.productId,
      );
      return {
        productId: match?.id || p.productId,
        productName: p.productName || match?.name || null,
        quantity: Number(p.quantity) || 1,
        unit: p.unit || match?.unit || null,
      };
    }),
  };

  // Build Actual Summary Text
  const summaryLines: string[] = [
    `บันทึกผลการติดตามแปลงสาธิต (นอกแผน)`,
    `แปลงสาธิต: ${items.map((i) => i.plotName).join(", ")}`,
    `เกษตรกร: ${items.map((i) => i.farmerName).join(", ")}`,
    `วันที่ติดตามจริง: ${firstItem.visitDate || new Date().toISOString().split("T")[0]}`,
    `จำนวนวันหลังฉีดพ่น: ${firstItem.daysAfterSpray ?? 0} วัน`,
    `จำนวนรอบการฉีดพ่น: ${(firstItem.sprayingRounds || []).length} รอบ`,
  ];

  const firstRound = firstItem.sprayingRounds?.[0];
  if (firstRound) {
    summaryLines.push(`วิธีการฉีดพ่น (รอบ 1): ${firstRound.sprayMethod === "TANK_MIXED" ? "ผสมถัง (Tank-mixed)" : "ฉีดเดี่ยว (Single)"}`);
    summaryLines.push(`อุปกรณ์ที่ใช้ฉีดพ่น (รอบ 1): ${firstRound.sprayEquipment || "-"}`);
    summaryLines.push(`ผลหลังการฉีดพ่น (รอบ 1): ${firstRound.productResponse || "-"}`);
    if (firstRound.problemDetail) {
      summaryLines.push(`ปัญหาที่พบ: ${firstRound.problemDetail}`);
    }
  }

  if (firstItem.nextSprayDate) {
    summaryLines.push(`กำหนดฉีดพ่นครั้งถัดไป: ${firstItem.nextSprayDate}`);
  }
  if (firstItem.notes) {
    summaryLines.push(`ข้อสังเกตเพิ่มเติม: ${firstItem.notes}`);
  }
  if (firstItem.plotStatus) {
    summaryLines.push(`สถานะแปลงสาธิต: ${firstItem.plotStatus}`);
  }
  if (firstItem.finalYieldKg) {
    summaryLines.push(`ผลผลิตแปลงสาธิต: ${firstItem.finalYieldKg} กก.`);
  }
  if (firstItem.controlYieldKg) {
    summaryLines.push(`ผลผลิตแปลงเปรียบเทียบ: ${firstItem.controlYieldKg} กก.`);
  }
  if (firstItem.farmerSatisfaction) {
    summaryLines.push(`ความพึงพอใจของเกษตรกร: ${firstItem.farmerSatisfaction} ดาว`);
  }
  if (firstItem.commercialPotential) {
    summaryLines.push(`โอกาสขยายผลเชิงพาณิชย์: ${firstItem.commercialPotential}`);
  }
  if (firstItem.finalSummaryNotes) {
    summaryLines.push(`สรุปผลภาพรวม: ${firstItem.finalSummaryNotes}`);
  }

  // Collect all photos: Crop condition images + All round images
  const allCropImages = items.flatMap((i) => i.cropImages || i.photos || []);
  const allRoundImages = items.flatMap((i) =>
    (i.sprayingRounds || []).flatMap((r) => r.roundImages || []),
  );
  const combinedPhotos = [...allCropImages, ...allRoundImages];

  const actualOutcome = {
    resultStatus: "COMPLETED",
    resultSummary: summaryLines.join("\n"),
    attachments: combinedPhotos.map((img: any) => ({
      id: img.id,
      fileUrl: img.url || img.fileUrl,
      fileName: img.name || img.fileName,
      fileSize: img.size || img.fileSize,
    })),
    type7bActual: {
      t7PlotName: firstItem.plotName,
      t7FarmerName: firstItem.farmerName,
      t7VisitDate: firstItem.visitDate || new Date().toISOString().split("T")[0],
      t7DaysAfterSpray: Number(firstItem.daysAfterSpray) || 0,
      t7CropImages: firstItem.cropImages || [],
      t7SprayingRounds: firstItem.sprayingRounds || [],
      t7NextSprayDate: firstItem.nextSprayDate || null,
      t7Notes: firstItem.notes || null,
      t7PlotStatus: firstItem.plotStatus || "IN_PROGRESS",
      t7FinalYieldKg: firstItem.finalYieldKg || null,
      t7ControlYieldKg: firstItem.controlYieldKg || null,
      t7FarmerSatisfaction: firstItem.farmerSatisfaction != null ? Number(firstItem.farmerSatisfaction) : null,
      t7CommercialPotential: firstItem.commercialPotential || null,
      t7FinalSummaryNotes: firstItem.finalSummaryNotes || null,
      t7CropCondition: firstItem.cropCondition || "สมบูรณ์",
      t7GrowthStage: firstItem.growthStage || "-",
      t7ProductResponse: firstRound?.productResponse || firstItem.productResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
      t7CropProblemDescription: firstRound?.problemDetail || firstItem.cropProblemDescription || null,
      t7SprayMethod: firstRound?.sprayMethod || firstItem.sprayMethod || "SINGLE",
      t7SprayEquipment: firstRound?.sprayEquipment || firstItem.sprayEquipment || "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
      t7OtherEquipment: firstRound?.otherEquipment || null,
      demoPlotId: firstItem.demoPlotId || null,
      t7DemoPlotId: firstItem.demoPlotId || null,
    },
  };

  return {
    type7bData,
    actualOutcome,
    planProducts,
  };
}
