import type { Type7bUnplannedItem } from "../types/unplanned.types";
import type { Type7bWithdrawnProductLine } from "../../shared/types";

/**
 * Hydrates Type 7B Unplanned Form Items from initial data
 */
export function hydrateType7bUnplannedData(initialData: any): Type7bUnplannedItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type7bUnplannedItems) && initialData.type7bUnplannedItems.length > 0) {
    return initialData.type7bUnplannedItems;
  }

  const t7b = initialData.type7b || initialData.type7bData;
  if (!t7b) return [];

  const rawPlots: any[] = t7b.plots || [];
  const rawProducts: any[] = t7b.products || [];

  const withdrawn: Type7bWithdrawnProductLine[] = rawProducts.map((p, idx) => ({
    id: p.id || String(idx + 1),
    productId: p.productId,
    productName: p.productName || p.product?.name || "",
    quantity: Number(p.quantity) || 1,
    unit: p.unit || p.product?.unit || "",
  }));

  if (rawPlots.length > 0) {
    return rawPlots.map((plot, idx) => ({
      id: plot.id || String(idx + 1),
      demoPlotId: plot.demoPlotId || null,
      sourceActivityPlanId: t7b.sourceActivityPlanId || null,
      plotName: plot.plotName || "",
      farmerName: plot.ownerName || plot.farmerName || "",
      province: plot.province || "",
      district: plot.district || "",
      cropCategory: plot.cropCategory || "",
      cropName: plot.cropName || "",
      areaRai: plot.areaRai != null ? Number(plot.areaRai) : null,
      treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
      dealerName: plot.dealerName || "",
      cropCondition: "สมบูรณ์",
      growthStage: "",
      productResponse: "พืชตอบสนองดี",
      hasProductWithdrawal: withdrawn.length > 0,
      withdrawnProducts: withdrawn,
      photos: [],
      plotStatus: "IN_PROGRESS",
    }));
  }

  return [];
}

/**
 * Maps Type 7B Unplanned Items to payload for saving plan & actual outcome together
 */
export function mapType7bUnplannedToPayload(items: Type7bUnplannedItem[]) {
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

  const allWithdrawn: Type7bWithdrawnProductLine[] = items.flatMap(
    (item) => (item.hasProductWithdrawal ? item.withdrawnProducts || [] : []),
  );

  const validWithdrawn = allWithdrawn.filter((p) => Boolean(p.productId));

  const planProducts = validWithdrawn.map((p) => ({
    workTypeCode: "TYPE_7B",
    productId: p.productId,
    productName: p.productName || null,
    targetQuantity: Number(p.quantity) || 1,
    isPriceOverridden: false,
  }));

  const type7bData = {
    sourceActivityPlanId: firstItem.sourceActivityPlanId || null,
    demoPlotId: firstItem.demoPlotId || allPlotIds[0] || null,
    notes: firstItem.notes || firstItem.objective || null,
    objective: firstItem.objective || firstItem.notes || null,
    plots,
    products: validWithdrawn.map((p) => ({
      productId: p.productId,
      productName: p.productName || null,
      quantity: Number(p.quantity) || 1,
      unit: p.unit || null,
      notes: p.notes || null,
    })),
  };

  // Build Actual Summary Text
  const summaryLines: string[] = [
    `บันทึกผลการติดตามแปลงสาธิต (นอกแผน)`,
    `แปลงสาธิต: ${items.map((i) => i.plotName).join(", ")}`,
    `เกษตรกร: ${items.map((i) => i.farmerName).join(", ")}`,
    `สภาพแปลง: ${firstItem.cropCondition}`,
    `ระยะการเจริญเติบโต: ${firstItem.growthStage}`,
  ];

  if (firstItem.productResponse) {
    summaryLines.push(`ผลหลังการฉีดพ่น: ${firstItem.productResponse}`);
  }
  if (firstItem.cropProblemDescription) {
    summaryLines.push(`ปัญหาของสภาพพืช: ${firstItem.cropProblemDescription}`);
  }
  if (firstItem.sprayMethod) {
    summaryLines.push(`วิธีการฉีดพ่น: ${firstItem.sprayMethod}`);
  }
  if (firstItem.sprayEquipment) {
    summaryLines.push(`อุปกรณ์ที่ใช้ฉีดพ่น: ${firstItem.sprayEquipment}`);
  }
  if (firstItem.nextSprayDate) {
    summaryLines.push(`กำหนดการติดตามครั้งถัดไป: ${firstItem.nextSprayDate}`);
  }
  if (firstItem.finalYieldKg) {
    summaryLines.push(`ผลผลิตแปลงสาธิต: ${firstItem.finalYieldKg} กก.`);
  }
  if (firstItem.controlYieldKg) {
    summaryLines.push(`ผลผลิตแปลงเปรียบเทียบ: ${firstItem.controlYieldKg} กก.`);
  }
  if (firstItem.farmerSatisfaction) {
    summaryLines.push(`ความพึงพอใจของเกษตรกร: ${firstItem.farmerSatisfaction}`);
  }
  if (firstItem.commercialPotential) {
    summaryLines.push(`โอกาสขยายผลเชิงพาณิชย์: ${firstItem.commercialPotential}`);
  }
  if (firstItem.finalSummaryNotes) {
    summaryLines.push(`สรุปผลภาพรวม: ${firstItem.finalSummaryNotes}`);
  }

  const allPhotos = items.flatMap((i) => i.photos || []);

  const actualOutcome = {
    resultStatus: "COMPLETED",
    resultSummary: summaryLines.join("\n"),
    attachments: allPhotos.map((img) => ({
      id: img.id,
      fileUrl: img.url,
      fileName: img.name,
      fileSize: img.size,
    })),
    type7bActual: {
      t7PlotName: firstItem.plotName,
      t7FarmerName: firstItem.farmerName,
      t7CropCondition: firstItem.cropCondition,
      t7GrowthStage: firstItem.growthStage,
      t7ProductResponse: firstItem.productResponse,
      t7CropProblemDescription: firstItem.cropProblemDescription,
      t7SprayMethod: firstItem.sprayMethod,
      t7SprayEquipment: firstItem.sprayEquipment,
      t7NextSprayDate: firstItem.nextSprayDate,
      t7PlotStatus: firstItem.plotStatus || "IN_PROGRESS",
      t7FinalYieldKg: firstItem.finalYieldKg,
      t7ControlYieldKg: firstItem.controlYieldKg,
      t7FarmerSatisfaction: firstItem.farmerSatisfaction,
      t7CommercialPotential: firstItem.commercialPotential,
      t7FinalSummaryNotes: firstItem.finalSummaryNotes,
    },
  };

  return {
    type7bData,
    actualOutcome,
    planProducts,
  };
}
