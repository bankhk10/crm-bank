import {
  findFarmerCustomersForPlots,
  findMasterDemoPlots,
  findFollowUpDemoPlots,
  findFarmerCustomerOptions,
  findDemoPlotOwners,
  findDemoPlotByIdOrName,
  findDemoPlotByOwnerAndCrop,
  recordDemoPlotVisit,
} from "../infrastructure/activity-plan.repository";
import type { UserDemoPlotOption } from "../constants";

function mapDemoPlotToOption(
  p: any,
  farmerMap: Map<string, any>,
): UserDemoPlotOption {
  const visitsCount = p.visits.length;
  const totalCost = p.visits.reduce(
    (sum: number, v: any) => sum + (Number(v.totalVisitCost) || 0),
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
    latitude: p.latitude ? String(p.latitude) : plotLat,
    longitude: p.longitude ? String(p.longitude) : plotLng,
    province: p.province || undefined,
    district: p.district || undefined,
    initialSprayDate: p.initialSprayDate ? p.initialSprayDate.toISOString().split("T")[0] : undefined,
    nextSprayDate: p.nextSprayDate ? p.nextSprayDate.toISOString().split("T")[0] : undefined,
    mainCropInfo: p.mainCropInfo || undefined,
    sprayMethod: p.sprayMethod || undefined,
    hasExternalChemicals: p.hasExternalChemicals || false,
    demoProducts: p.demoProducts,
    externalProducts: p.externalProducts,
    irrigations: (p.irrigations || []).map((ir: any) => ir.method),
  };
}

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

  const realPlots: UserDemoPlotOption[] = masterPlots.map((p) =>
    mapDemoPlotToOption(p, farmerMap),
  );

  // 3. Map farmer agricultural farm plots from Customer.farmPlots (for NEW_DEMO and linking)
  farmerCustomers.forEach((farmer) => {
    if (farmer.farmPlots && Array.isArray(farmer.farmPlots)) {
      (farmer.farmPlots as any[]).forEach((fp, idx) => {
        const cropDisplay = fp.cropType || "พืชเกษตร";
        const varietyDisplay = fp.variety ? ` (${fp.variety})` : "";
        const plotLabel = `แปลงที่ ${idx + 1}: ${cropDisplay}${varietyDisplay}`;

        // Location details
        const locParts: string[] = [];
        if (fp.soilType) locParts.push(`ดิน: ${fp.soilType}`);
        if (fp.waterSource) locParts.push(`แหล่งน้ำ: ${fp.waterSource}`);
        const locationStr =
          locParts.length > 0
            ? locParts.join(", ")
            : farmer.name
              ? `แปลงเกษตรของ ${farmer.name}`
              : "";

        const farmPlotOption: UserDemoPlotOption = {
          id: `farmplot-${farmer.id}-${idx}`,
          code: `FP-${farmer.id.slice(-4)}-${idx + 1}`,
          name: plotLabel,
          location: locationStr,
          targetCrop: `${cropDisplay}${varietyDisplay}`,
          showcase: "",
          ownerName: farmer.name,
          cropCategory: cropDisplay,
          cropName: cropDisplay,
          customCropName: fp.variety || undefined,
          areaRai: fp.areaRai ? Number(fp.areaRai) : 0,
          treeCount: 0,
          status: "IN_PROGRESS",
          latitude: fp.latitude || farmer.latitude || undefined,
          longitude: fp.longitude || farmer.longitude || undefined,
        };

        realPlots.push(farmPlotOption);
      });
    }
  });

  return {
    success: true as const,
    demoPlots: realPlots,
  };
}

/**
 * Use Case: Get follow-up demo plots strictly for TYPE_7B "ติดตามแปลงสาธิต"
 * Only returns plots originating from TYPE_7A that are APPROVED and COMPLETED ("ปฏิบัติงานแล้วเสร็จ")
 * Does NOT include Customer.farmPlots.
 */
export async function getFollowUpDemoPlotsUseCase() {
  const farmerCustomers = await findFarmerCustomersForPlots();
  const farmerMap = new Map<string, (typeof farmerCustomers)[0]>();
  farmerCustomers.forEach((f) => {
    farmerMap.set(f.id, f);
    if (f.name) farmerMap.set(f.name.trim(), f);
  });

  const followUpPlots = await findFollowUpDemoPlots();
  const demoPlots = followUpPlots.map((p) => mapDemoPlotToOption(p, farmerMap));

  return {
    success: true as const,
    demoPlots,
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

  if (!plot && demoPlotIdOrName.includes(" - ")) {
    const [owner, crop] = demoPlotIdOrName.split(" - ").map((s) => s.trim());
    if (owner && crop) {
      plot = await findDemoPlotByOwnerAndCrop(owner, crop);
    }
  }

  if (!plot) {
    return {
      success: false as const,
      error: "ไม่พบแปลงสาธิต",
      plot: null,
    };
  }

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
    nextSprayDate: rawData.nextSprayDate ? new Date(rawData.nextSprayDate) : null,
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
