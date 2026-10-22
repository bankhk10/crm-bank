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
      ownerName: p.ownerName || p.farmerName || p.store?.name,
      farmerName: p.farmerName || p.ownerName || p.store?.name,
      storeId: p.storeId,
      province: p.province,
      district: p.district,
      cropName: p.cropName || p.customCropName || p.cropCategory,
      customCropName: p.customCropName,
      cropCategory: p.cropCategory,
      areaRai: p.areaRai != null ? Number(p.areaRai) : null,
      treeCount: p.treeCount != null ? Number(p.treeCount) : null,
      objective: p.objective,
      categoryId: p.categoryId || null,
      demoProducts: (p.demoProducts || p.products || []).map((prod: any) => ({
        ...prod,
        productId: prod.productId || prod.product?.id,
        productName: prod.productName || prod.product?.name,
        categoryId: prod.categoryId || prod.product?.categoryId || p.categoryId || null,
        quantity: prod.quantity != null ? Number(prod.quantity) : Number(prod.targetQuantity || 1),
        targetQuantity: prod.targetQuantity != null ? Number(prod.targetQuantity) : Number(prod.quantity || 1),
      })),
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
        customCropName: plan.demoPlotData.customCropName,
        cropCategory: plan.demoPlotData.cropCategory,
        areaRai: plan.demoPlotData.areaRai,
        treeCount: plan.demoPlotData.treeCount,
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
    return initialData.type7aPlots.map((p: any, idx: number) => {
      const rawProducts = p.demoProducts || p.products || [];
      const mappedProducts = rawProducts.map((prod: any, pIdx: number) => ({
        id: prod.id || `prod-${idx}-${pIdx}`,
        categoryId:
          prod.categoryId ||
          prod.product?.categoryId ||
          p.categoryId ||
          null,
        productId: prod.productId || prod.product?.id || "",
        productName: prod.productName || prod.product?.name || "",
        quantity:
          prod.quantity != null
            ? Number(prod.quantity)
            : prod.targetQuantity != null
              ? Number(prod.targetQuantity)
              : 1,
        targetQuantity:
          prod.targetQuantity != null
            ? Number(prod.targetQuantity)
            : prod.quantity != null
              ? Number(prod.quantity)
              : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }));

      return {
        id: p.id || `plot-${idx}`,
        demoPlotId: p.demoPlotId || null,
        plotName: p.plotName || p.name || "",
        name: p.name || p.plotName || "",
        farmerName: p.farmerName || p.ownerName || p.store?.name || "",
        ownerName: p.ownerName || p.farmerName || p.store?.name || "",
        ownerPhone: p.ownerPhone || "",
        storeId: p.storeId || null,
        province: p.province || p.store?.province || "",
        district: p.district || p.store?.district || "",
        subdistrict: p.subdistrict || "",
        cropCategory: p.cropCategory || "",
        cropName: p.cropName || "",
        customCropName: p.customCropName || "",
        areaRai: p.areaRai != null ? Number(p.areaRai) : null,
        treeCount: p.treeCount != null ? Number(p.treeCount) : null,
        plantingDate: p.plantingDate
          ? new Date(p.plantingDate).toISOString().split("T")[0]
          : null,
        initialSprayDate: p.initialSprayDate
          ? new Date(p.initialSprayDate).toISOString().split("T")[0]
          : null,
        nextSprayDate: p.nextSprayDate
          ? new Date(p.nextSprayDate).toISOString().split("T")[0]
          : null,
        objective: p.objective || "",
        notes: p.notes || "",
        categoryId: p.categoryId || mappedProducts[0]?.categoryId || null,
        chemicalGroupId: p.chemicalGroupId || null,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        hasProducts: p.hasProducts ?? true,
        demoProducts: mappedProducts,
        products: mappedProducts,
      };
    });
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
    subtitle: `ร้านค้า Dealer: ${t.ownerName || t.farmerName || "-"} | พืช: ${t.customCropName || t.cropName || t.cropCategory || "-"}`,
    details: t.objective || "",
    products: (t.demoProducts || []).map((p) => ({
      name: p.productName || "-",
      quantity: p.quantity || p.targetQuantity || 0,
      unit: p.unit || "ชิ้น",
    })),
  }));
}
