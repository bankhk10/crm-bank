import type { Type7aPlanItem, Type7aTargetItem } from "../types/planned.types";

/**
 * Extract Type 7A Plan Targets from raw plan object
 */
export function extractType7aPlanTargets(
  plan: any,
  prevTarget?: Type7aTargetItem,
): {
  primary: Type7aTargetItem;
  list: Type7aTargetItem[];
} {
  const fallbackItem: Type7aTargetItem = {
    plotName: "",
    farmerName: "",
    cropCategory: "",
    cropName: "",
    areaRai: null,
    objective: "",
    demoProducts: [],
    ...prevTarget,
  };

  if (!plan) return { primary: fallbackItem, list: [] };

  let list: Type7aTargetItem[] = [];

  if (Array.isArray(plan.type7aPlots) && plan.type7aPlots.length > 0) {
    list = plan.type7aPlots.map((p: any) => ({
      id: p.id,
      plotName: p.plotName || p.name,
      ownerName: p.ownerName || p.farmerName,
      farmerName: p.farmerName || p.ownerName,
      storeId: p.storeId,
      province: p.province,
      district: p.district,
      cropName: p.cropName || p.customCropName || p.cropCategory,
      cropCategory: p.cropCategory,
      areaRai: p.areaRai,
      objective: p.objective,
      demoProducts: p.demoProducts || p.products || [],
    }));
  } else if (plan.demoPlotData) {
    list = [
      {
        id: plan.demoPlotData.id,
        plotName: plan.demoPlotData.plotName || plan.demoPlotData.name,
        ownerName: plan.demoPlotData.ownerName || plan.demoPlotData.farmerName,
        farmerName: plan.demoPlotData.farmerName || plan.demoPlotData.ownerName,
        storeId: plan.demoPlotData.storeId,
        province: plan.demoPlotData.province,
        district: plan.demoPlotData.district,
        cropName: plan.demoPlotData.cropName || plan.demoPlotData.customCropName,
        cropCategory: plan.demoPlotData.cropCategory,
        areaRai: plan.demoPlotData.areaRai,
        objective: plan.demoPlotData.objective,
        demoProducts: plan.demoProducts || [],
      },
    ];
  }

  return {
    primary: list[0] || fallbackItem,
    list,
  };
}

/**
 * Hydrate Type 7A Planned form items from raw plan object
 */
export function hydrateType7aPlannedData(initialData: any): Type7aPlanItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type7aPlots) && initialData.type7aPlots.length > 0) {
    return initialData.type7aPlots.map((p: any, idx: number) => ({
      id: p.id || `plot-${idx}`,
      demoPlotId: p.demoPlotId || null,
      plotName: p.plotName || p.name || "",
      name: p.name || p.plotName || "",
      farmerName: p.farmerName || p.ownerName || "",
      ownerName: p.ownerName || p.farmerName || "",
      ownerPhone: p.ownerPhone || "",
      storeId: p.storeId || null,
      province: p.province || "",
      district: p.district || "",
      subdistrict: p.subdistrict || "",
      cropCategory: p.cropCategory || "",
      cropName: p.cropName || "",
      customCropName: p.customCropName || "",
      areaRai: p.areaRai != null ? Number(p.areaRai) : null,
      treeCount: p.treeCount != null ? Number(p.treeCount) : null,
      plantingDate: p.plantingDate ? new Date(p.plantingDate).toISOString().split("T")[0] : null,
      initialSprayDate: p.initialSprayDate ? new Date(p.initialSprayDate).toISOString().split("T")[0] : null,
      nextSprayDate: p.nextSprayDate ? new Date(p.nextSprayDate).toISOString().split("T")[0] : null,
      objective: p.objective || "",
      notes: p.notes || "",
      categoryId: p.categoryId || null,
      chemicalGroupId: p.chemicalGroupId || null,
      latitude: p.latitude || null,
      longitude: p.longitude || null,
      hasProducts: p.hasProducts ?? true,
      demoProducts: p.demoProducts || p.products || [],
      products: p.products || p.demoProducts || [],
    }));
  }

  if (initialData.demoPlotData) {
    const d = initialData.demoPlotData;
    return [
      {
        id: d.id || "plot-0",
        demoPlotId: d.demoPlotId || d.id || null,
        plotName: d.plotName || d.name || "",
        name: d.name || d.plotName || "",
        farmerName: d.farmerName || d.ownerName || "",
        ownerName: d.ownerName || d.farmerName || "",
        ownerPhone: d.ownerPhone || "",
        storeId: d.storeId || d.customerId || null,
        province: d.province || "",
        district: d.district || "",
        subdistrict: d.subdistrict || "",
        cropCategory: d.cropCategory || "",
        cropName: d.cropName || "",
        customCropName: d.customCropName || "",
        areaRai: d.areaRai != null ? Number(d.areaRai) : null,
        treeCount: d.treeCount != null ? Number(d.treeCount) : null,
        objective: d.objective || "",
        notes: d.notes || "",
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        hasProducts: true,
        demoProducts: initialData.demoProducts || [],
        products: initialData.demoProducts || [],
      },
    ];
  }

  return [];
}

/**
 * Map Type 7A to section summary items
 */
export function mapType7aToSectionItems(targets: Type7aTargetItem[]) {
  return targets.map((t) => ({
    title: t.plotName || "แปลงสาธิต",
    subtitle: `เกษตรกร: ${t.ownerName || t.farmerName || "-"} | พืช: ${t.cropName || t.cropCategory || "-"}`,
    details: t.objective || "",
    products: (t.demoProducts || []).map((p) => ({
      name: p.productName || "-",
      quantity: p.quantity || p.targetQuantity || 0,
      unit: p.unit || "ชิ้น",
    })),
  }));
}
