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
    list = plan.type7aPlots.map((p: any) => {
      const dp = p.demoPlot || p;
      const rawProducts = dp.demoProducts?.length ? dp.demoProducts : (p.demoProducts || p.products || []);
      return {
        id: p.id,
        demoPlotId: p.demoPlotId || dp.id,
        demoPlot: dp,
        plotName: dp.name || p.plotName || p.name || "",
        ownerName: dp.ownerName || p.ownerName || p.farmerName || dp.customer?.name || p.store?.name || "",
        farmerName: dp.ownerName || p.farmerName || p.ownerName || dp.customer?.name || p.store?.name || "",
        farmerCustomerId: dp.farmerCustomerId || null,
        farmerCustomer: dp.farmerCustomer || null,
        farmerPhone: dp.ownerPhone || dp.farmerCustomer?.phone || "",
        storeId: dp.customerId || p.storeId || null,
        province: dp.province || dp.ownerProvince || p.province || dp.customer?.province || p.store?.province || "",
        district: dp.district || dp.ownerDistrict || p.district || dp.customer?.district || p.store?.district || "",
        subdistrict: dp.ownerSubdistrict || p.subdistrict || "",
        cropName: dp.cropName || dp.customCropName || dp.cropCategory || p.cropName || "",
        customCropName: dp.customCropName || p.customCropName || null,
        cropCategory: dp.cropCategory || p.cropCategory || "",
        areaRai: dp.areaRai != null ? Number(dp.areaRai) : (p.areaRai != null ? Number(p.areaRai) : null),
        treeCount: dp.treeCount != null ? Number(dp.treeCount) : (p.treeCount != null ? Number(p.treeCount) : null),
        objective: dp.objective || p.objective || "",
        categoryId: dp.categoryId || p.categoryId || null,
        latitude: dp.latitude != null ? Number(dp.latitude) : null,
        longitude: dp.longitude != null ? Number(dp.longitude) : null,
        demoProducts: rawProducts.map((prod: any) => ({
          ...prod,
          productId: prod.productId || prod.product?.id,
          productName: prod.productName || prod.product?.name,
          categoryId: prod.categoryId || prod.product?.categoryId || dp.categoryId || p.categoryId || null,
          quantity:
            prod.quantity != null
              ? Number(prod.quantity)
              : prod.targetQuantity != null
                ? Number(prod.targetQuantity)
                : prod.withdrawnQuantity != null
                  ? Number(prod.withdrawnQuantity)
                  : 1,
          targetQuantity:
            prod.targetQuantity != null
              ? Number(prod.targetQuantity)
              : prod.quantity != null
                ? Number(prod.quantity)
                : prod.withdrawnQuantity != null
                  ? Number(prod.withdrawnQuantity)
                  : 1,
        })),
      };
    });
  } else if (plan.demoPlotData || plan.demoPlot) {
    const dp = plan.demoPlotData || plan.demoPlot;
    list = [
      {
        id: dp.id,
        demoPlotId: dp.id,
        demoPlot: dp,
        plotName: dp.plotName || dp.name,
        ownerName: dp.ownerName || dp.farmerName,
        farmerName: dp.farmerName || dp.ownerName,
        farmerCustomerId: dp.farmerCustomerId,
        farmerPhone: dp.ownerPhone,
        storeId: dp.storeId || dp.customerId,
        province: dp.ownerProvince || dp.province,
        district: dp.ownerDistrict || dp.district,
        subdistrict: dp.ownerSubdistrict,
        cropName: dp.cropName || dp.customCropName,
        customCropName: dp.customCropName,
        cropCategory: dp.cropCategory,
        areaRai: dp.areaRai != null ? Number(dp.areaRai) : null,
        treeCount: dp.treeCount != null ? Number(dp.treeCount) : null,
        objective: dp.objective,
        latitude: dp.latitude != null ? Number(dp.latitude) : null,
        longitude: dp.longitude != null ? Number(dp.longitude) : null,
        demoProducts: dp.demoProducts || plan.demoProducts || [],
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
              : prod.withdrawnQuantity != null
                ? Number(prod.withdrawnQuantity)
                : 1,
        targetQuantity:
          prod.targetQuantity != null
            ? Number(prod.targetQuantity)
            : prod.quantity != null
              ? Number(prod.quantity)
              : prod.withdrawnQuantity != null
                ? Number(prod.withdrawnQuantity)
                : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }));

      return {
        id: p.id || `plot-${idx}`,
        demoPlotId: p.demoPlotId || p.id || null,
        plotName: p.plotName || p.name || "",
        name: p.name || p.plotName || "",
        farmerName: p.farmerName || p.ownerName || p.customer?.name || p.store?.name || "",
        ownerName: p.ownerName || p.farmerName || p.customer?.name || p.store?.name || "",
        ownerPhone: p.ownerPhone || p.farmerCustomer?.phone || "",
        storeId: p.storeId || p.customerId || null,
        province: p.province || p.customer?.province || p.store?.province || "",
        district: p.district || p.customer?.district || p.store?.district || "",
        subdistrict: p.ownerSubdistrict || p.subdistrict || "",
        cropCategory: p.cropCategory || "",
        cropName: p.cropName || "",
        customCropName: p.customCropName || "",
        areaRai: p.areaRai != null ? Number(p.areaRai) : null,
        treeCount: p.treeCount != null ? Number(p.treeCount) : null,
        plantingDate: p.plantingDate
          ? new Date(p.plantingDate).toISOString().split("T")[0]
          : p.startDate
            ? new Date(p.startDate).toISOString().split("T")[0]
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
        hasProducts: p.hasProducts ?? (mappedProducts.length > 0),
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
