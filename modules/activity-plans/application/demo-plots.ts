import {
  findFarmerCustomersForPlots,
  findMasterDemoPlots,
  findLegacyDemoPlotItems,
  findFarmerCustomerOptions,
  findDemoPlotOwners,
  findDemoPlotByIdOrName,
  findLegacyActivityItemForDemoPlot,
  findDemoPlotByOwnerAndCrop,
  findLatestCreateItemForDemoPlot,
  recordDemoPlotVisit,
} from "../infrastructure/activity-plan.repository";
import type { UserDemoPlotOption } from "../constants";

/**
 * Use Case: Get available demo plots (with real DemoPlot master records + legacy plan items fallback)
 */
export async function getDemoPlotsUseCase() {
  // 1. Fetch Farmer Customers to retrieve farm plots created in customer-form-farmer
  const farmerCustomers = await findFarmerCustomersForPlots();

  const farmerMap = new Map<string, (typeof farmerCustomers)[0]>();
  farmerCustomers.forEach((f) => {
    farmerMap.set(f.id, f);
    if (f.name) farmerMap.set(f.name.trim(), f);
  });

  // 2. Fetch from Master DemoPlot table
  const masterPlots = await findMasterDemoPlots();

  const realPlots: UserDemoPlotOption[] = masterPlots.map((p) => {
    const visitsCount = p.visits.length;
    const totalCost = p.visits.reduce(
      (sum, v) => sum + (Number(v.totalVisitCost) || 0),
      0,
    );
    const lastVisit = p.visits[p.visits.length - 1];
    const msPerDay = 1000 * 60 * 60 * 24;
    const latestDate = lastVisit ? new Date(lastVisit.visitDate) : new Date();
    const daysSinceStart = Math.max(
      0,
      Math.floor(
        (latestDate.getTime() - new Date(p.startDate).getTime()) / msPerDay,
      ),
    );

    // Check coordinates from linked farmer customer or location field
    const linkedCustomer =
      (p.customerId && farmerMap.get(p.customerId)) ||
      (p.ownerName && farmerMap.get(p.ownerName.trim()));

    let plotLat: string | undefined = undefined;
    let plotLng: string | undefined = undefined;

    if (linkedCustomer) {
      if (linkedCustomer.farmPlots && Array.isArray(linkedCustomer.farmPlots)) {
        const matchedPlot = (linkedCustomer.farmPlots as any[]).find(
          (fp) =>
            (fp.cropType && fp.cropType === p.cropName) ||
            (fp.latitude && fp.longitude),
        );
        if (matchedPlot) {
          plotLat = matchedPlot.latitude ? String(matchedPlot.latitude).trim() : undefined;
          plotLng = matchedPlot.longitude ? String(matchedPlot.longitude).trim() : undefined;
        }
      }
      if (!plotLat && linkedCustomer.latitude) {
        plotLat = String(linkedCustomer.latitude).trim();
      }
      if (!plotLng && linkedCustomer.longitude) {
        plotLng = String(linkedCustomer.longitude).trim();
      }
    }

    // Check if location string is formatted like "13.xxx, 100.xxx"
    if (!plotLat && !plotLng && p.location) {
      const coordMatch = p.location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        plotLat = coordMatch[1];
        plotLng = coordMatch[2];
      }
    }

    const formattedLocation =
      plotLat && plotLng
        ? `${plotLat}, ${plotLng}`
        : p.location || (p.ownerName ? `แปลงสาธิต ${p.ownerName}` : "");

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      location: formattedLocation,
      targetCrop: p.customCropName || p.cropName,
      showcase: p.primaryProductName,
      ownerName: p.ownerName,
      cropCategory: p.cropCategory,
      cropName: p.cropName,
      customCropName: p.customCropName || undefined,
      productName: p.primaryProductName,
      areaRai: p.areaRai ? Number(p.areaRai) : 0,
      treeCount: p.treeCount || 0,
      startDate: p.startDate ? p.startDate.toISOString().split("T")[0] : "",
      status: p.status,
      visitsCount,
      totalCost,
      daysSinceStart,
      objective: p.objective || undefined,
      experimentDetail: p.experimentDetail || undefined,
      latitude: plotLat,
      longitude: plotLng,
    };
  });

  // 3. Fetch from ActivityPlanItem (legacy fallback for backward compatibility)
  const items = await findLegacyDemoPlotItems();

  for (const item of items) {
    if (!item.plotOwnerName && !item.plotCropName) continue;

    const cropDisplay = item.plotCropName || "";
    const ownerDisplay = item.plotOwnerName || item.customerName || "เกษตรกร";
    const plotName = cropDisplay
      ? `${ownerDisplay} - ${cropDisplay}`
      : ownerDisplay;

    // Only add if not already present in masterPlots
    if (!realPlots.some((rp) => rp.name === plotName || rp.id === item.existingPlotId)) {
      realPlots.push({
        id: `legacy-${item.activityPlanId}-${item.id}`,
        name: plotName,
        location: item.activityPlan.location || `แปลงสาธิต ${ownerDisplay}`,
        targetCrop: cropDisplay,
        showcase: item.plotProductName || "",
        ownerName: ownerDisplay,
        cropCategory: item.plotCropCategory || "พืชสวน",
        cropName: cropDisplay || "พืชสวน",
        productName: item.plotProductName || "",
        areaRai: item.plotAreaRai ? Number(item.plotAreaRai) : 0,
        treeCount: item.plotTreeCount || 0,
        startDate: item.activityPlan.startDate ? item.activityPlan.startDate.toISOString().split("T")[0] : "",
        status: "IN_PROGRESS",
        visitsCount: 1,
        totalCost: 0,
        daysSinceStart: 0,
      });
    }
  }

  return {
    success: true as const,
    demoPlots: realPlots,
  };
}

/**
 * Use Case: Get list of Farmer customers for Type 10 Field Day target selection
 */
export async function getFarmerCustomersUseCase() {
  const farmers = await findFarmerCustomerOptions();
  const options: string[] = [];

  farmers.forEach((f) => {
    const name = f.name?.trim();
    if (!name) return;

    const plots = Array.isArray(f.farmPlots) ? (f.farmPlots as any[]) : [];
    if (plots.length > 0) {
      const totalRai = plots.reduce(
        (sum, p) => sum + (Number(p.areaRai) || 0),
        0,
      );
      const crops = Array.from(
        new Set(plots.map((p) => p.cropType).filter(Boolean)),
      ).join(", ");

      const details: string[] = [];
      if (crops) details.push(crops);
      if (totalRai > 0) details.push(`${totalRai} ไร่`);
      else if (f.district || f.province) {
        details.push([f.district, f.province].filter(Boolean).join(" "));
      }

      const label =
        details.length > 0 ? `${name} (${details.join(" ")})` : name;
      options.push(label);
    } else {
      const loc = [f.district, f.province].filter(Boolean).join(" ");
      const label = loc ? `${name} (${loc})` : name;
      options.push(label);
    }
  });

  // Also include demo plot owner names if any
  const demoPlots = await findDemoPlotOwners();

  demoPlots.forEach((dp) => {
    const name = dp.ownerName?.trim();
    if (!name) return;
    const alreadyHas = options.some((opt) => opt.startsWith(name));
    if (!alreadyHas) {
      const details: string[] = [];
      if (dp.cropName) details.push(dp.cropName);
      if (dp.areaRai) details.push(`${Number(dp.areaRai)} ไร่`);
      const label =
        details.length > 0 ? `${name} (${details.join(" ")})` : name;
      options.push(label);
    }
  });

  return {
    success: true as const,
    farmers: Array.from(new Set(options)),
  };
}

/**
 * Use Case: Get Demo Plot History with all visits
 */
export async function getDemoPlotHistoryUseCase(demoPlotIdOrName: string) {
  let plot: any = await findDemoPlotByIdOrName(demoPlotIdOrName);
  let originalCreateItem: any = null;

  if (!plot && demoPlotIdOrName.startsWith("legacy-")) {
    const parts = demoPlotIdOrName.replace("legacy-", "").split("-");
    const planId = parts[0];
    const itemId = parts[1];
    if (planId) {
      originalCreateItem = await findLegacyActivityItemForDemoPlot(itemId, planId);
      if (originalCreateItem) {
        const owner = originalCreateItem.plotOwnerName || originalCreateItem.customerName || "เกษตรกร";
        const crop = originalCreateItem.plotCropName || "พืชทั่วไป";
        plot = await findDemoPlotByOwnerAndCrop(owner, crop);
      }
    }
  }

  // Also look up CREATE ActivityPlanItem if not yet found
  if (!originalCreateItem) {
    const ownerToSearch = plot?.ownerName || (demoPlotIdOrName.includes(" - ") ? demoPlotIdOrName.split(" - ")[0].trim() : demoPlotIdOrName);
    const cropToSearch = plot?.cropName || (demoPlotIdOrName.includes(" - ") ? demoPlotIdOrName.split(" - ")[1].trim() : undefined);

    originalCreateItem = await findLatestCreateItemForDemoPlot(ownerToSearch, cropToSearch);
  }

  // Parse objective and experimentDetail from create item's detail
  let parsedObjective = "";
  let parsedExperiment = "";
  if (originalCreateItem?.detail) {
    const raw = originalCreateItem.detail;
    const objMatch = raw.match(/(?:วัตถุประสงค์ของแปลง|วัตถุประสงค์):\s*([^|]+)/);
    const expMatch = raw.match(/(?:รายละเอียด \/ วิธีการทดลอง|วิธีการทดลอง|รายละเอียดการทดลอง):\s*([^|]+)/);
    parsedObjective = objMatch ? objMatch[1].trim() : "";
    parsedExperiment = expMatch ? expMatch[1].trim() : (objMatch ? "" : raw);
  }

  if (!plot && originalCreateItem) {
    const owner = originalCreateItem.plotOwnerName || originalCreateItem.customerName || "เกษตรกร";
    const crop = originalCreateItem.plotCropName || "พืชทั่วไป";
    const plotName = `${owner} - ${crop}`;
    plot = {
      id: originalCreateItem.id,
      code: `DP-INIT`,
      name: plotName,
      ownerName: owner,
      cropName: crop,
      cropCategory: originalCreateItem.plotCropCategory || "พืชทั่วไป",
      primaryProductName: originalCreateItem.plotProductName || "",
      productName: originalCreateItem.plotProductName || "",
      areaRai: originalCreateItem.plotAreaRai ? Number(originalCreateItem.plotAreaRai) : null,
      treeCount: originalCreateItem.plotTreeCount || null,
      plotCount: originalCreateItem.plotCount != null ? Number(originalCreateItem.plotCount) : null,
      demoProductQuantity: originalCreateItem.plotCount != null ? Number(originalCreateItem.plotCount) : null,
      startDate: originalCreateItem.activityPlan?.startDate || new Date(),
      plantingDate: originalCreateItem.activityPlan?.startDate || null,
      objective: parsedObjective || null,
      experimentDetail: parsedExperiment || null,
      status: "IN_PROGRESS",
      visits: [],
    };
  }

  if (!plot) {
    return {
      success: false as const,
      error: "ไม่พบแปลงสาธิต",
      plot: null,
    };
  }

  // Fill in objective and experimentDetail if empty in demoPlot record
  const finalObjective = plot.objective || parsedObjective || undefined;
  const finalExperiment = plot.experimentDetail || parsedExperiment || undefined;
  const finalPlotCount = (plot as any).plotCount ?? (originalCreateItem?.plotCount != null ? Number(originalCreateItem.plotCount) : undefined);

  const visits = plot.visits || [];
  const totalCost = visits.reduce(
    (sum: number, v: any) => sum + (Number(v.totalVisitCost) || 0),
    0,
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  const now = new Date();
  const baseStartDate = plot.plantingDate || plot.startDate || now;
  const daysSinceStart = Math.max(
    0,
    Math.floor((now.getTime() - new Date(baseStartDate).getTime()) / msPerDay),
  );

  return {
    success: true as const,
    plot: {
      ...plot,
      objective: finalObjective,
      experimentDetail: finalExperiment,
      plotCount: finalPlotCount,
      demoProductQuantity: finalPlotCount,
      totalCost,
      daysSinceStart,
      visitsCount: visits.length,
    },
  };
}

/**
 * Use Case: Record Demo Plot Visit & Lifecycle status
 */
export async function recordDemoPlotVisitUseCase(rawData: any) {
  const visit = await recordDemoPlotVisit({
    demoPlotId: rawData.demoPlotId,
    activityPlanId: rawData.activityPlanId ?? null,
    visitDate: rawData.visitDate ? new Date(rawData.visitDate) : new Date(),
    cropAgeValue: rawData.cropAgeValue ? Number(rawData.cropAgeValue) : null,
    cropAgeUnit: rawData.cropAgeUnit ?? "วัน",
    growthStage: rawData.growthStage ?? null,
    cropCondition: rawData.cropCondition ?? null,
    cropProblemDesc: rawData.cropProblemDesc ?? null,
    productResponse: rawData.productResponse ?? null,
    productProblemDesc: rawData.productProblemDesc ?? null,
    usageMethod: rawData.usageMethod ?? null,
    plantingDate: rawData.plantingDate ? new Date(rawData.plantingDate) : null,
    plantingAreaCondition: rawData.plantingAreaCondition ?? null,
    productUsedQty: rawData.productUsedQty ? Number(rawData.productUsedQty) : 0,
    productUnitPrice: rawData.productUnitPrice ? Number(rawData.productUnitPrice) : 0,
    otherExpenses: rawData.otherExpenses ? Number(rawData.otherExpenses) : 0,
    cropImageUrls: rawData.cropImageUrls || [],
    plotImageUrls: rawData.plotImageUrls || [],
    imageUrls: rawData.imageUrls || rawData.plotImageUrls || [],
    notes: rawData.notes ?? null,
    plotStatus: rawData.plotStatus,
    finalYieldKg: rawData.finalYieldKg ? Number(rawData.finalYieldKg) : null,
    controlYieldKg: rawData.controlYieldKg ? Number(rawData.controlYieldKg) : null,
    yieldIncreasePercent: rawData.yieldIncreasePercent ? Number(rawData.yieldIncreasePercent) : null,
    farmerSatisfaction: rawData.farmerSatisfaction ? Number(rawData.farmerSatisfaction) : null,
    commercialPotential: rawData.commercialPotential ?? null,
    finalSummaryNotes: rawData.finalSummaryNotes ?? null,
  });

  return { success: true as const, visit };
}
