import type { Type7aPlanItem, Type7aTargetItem } from "../types/planned.types";
import { formatPhoneNumber } from "../../shared/utils";

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
  const sourcePlots =
    Array.isArray(plan.type7aTargets) && plan.type7aTargets.length > 0
      ? plan.type7aTargets
      : plan.type7aPlots;

  if (Array.isArray(sourcePlots) && sourcePlots.length > 0) {
    list = sourcePlots.map((p: any) => {
      // Find full demoPlot from plan.type7aPlots if available
      const fullDemoPlot = Array.isArray(plan.type7aPlots)
        ? plan.type7aPlots.find((plot: any) => plot.id === p.demoPlotId || plot.id === p.id)
        : null;
      const dp = fullDemoPlot || p.demoPlot || p;
      const dedicatedResult = p.results?.[0] || plan.type7aResults?.[0] || null;
      const visit1 = dp.visits?.[0];

      // Products: Prioritize dedicated actualProducts if present
      const actualProds = dedicatedResult?.actualProducts;
      const rawProducts =
        Array.isArray(actualProds) && actualProds.length > 0
          ? actualProds.map((ap: any) => ({
              id: ap.id,
              productId: ap.productId || ap.product?.id,
              productName: ap.productName || ap.product?.name,
              quantity: ap.actualQuantity != null ? Number(ap.actualQuantity) : 1,
              actualQuantity: ap.actualQuantity != null ? Number(ap.actualQuantity) : 1,
              withdrawnQuantity: ap.withdrawnQuantity != null ? Number(ap.withdrawnQuantity) : 1,
              extraQuantity: ap.extraQuantity != null ? String(ap.extraQuantity) : "",
              extraUnit: ap.extraUnit || (ap.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
              applicationRate: ap.actualRate || "",
              isAdditional: !ap.isPlanned,
            }))
          : dp.demoProducts?.length
          ? dp.demoProducts
          : (p.demoProducts || p.products || []);

      return {
        id: p.id,
        demoPlotId: p.demoPlotId || dp.id,
        demoPlot: dp,
        plotName: dp.name || p.plotName || p.name || "",
        ownerName:
          dedicatedResult?.farmerName ||
          dp.ownerName ||
          p.ownerName ||
          p.farmerName ||
          dp.customer?.name ||
          p.store?.name ||
          "",
        farmerName:
          dedicatedResult?.farmerName ||
          dp.ownerName ||
          p.farmerName ||
          p.ownerName ||
          dp.customer?.name ||
          p.store?.name ||
          "",
        farmerCustomerId: dedicatedResult?.farmerCustomerId || dp.farmerCustomerId || null,
        farmerCustomer: dp.farmerCustomer || null,
        farmerPhone: formatPhoneNumber(dedicatedResult?.farmerPhone || dp.ownerPhone || dp.farmerCustomer?.phone || p.farmerPhone || ""), 
        isUnregisteredFarmer:
          dedicatedResult?.isUnregisteredFarmer != null
            ? Boolean(dedicatedResult.isUnregisteredFarmer)
            : dp.isUnregisteredFarmer != null
            ? Boolean(dp.isUnregisteredFarmer)
            : false,
        storeId: dp.customerId || p.storeId || null,
        dealerName: dp.customer?.name || p.store?.name || "",
        dealerCode: dp.customer?.customerCode || p.store?.customerCode || "",
        province:
          dedicatedResult?.province ||
          dp.province ||
          dp.ownerProvince ||
          p.province ||
          dp.customer?.province ||
          p.store?.province ||
          "",
        district:
          dedicatedResult?.district ||
          dp.district ||
          dp.ownerDistrict ||
          p.district ||
          dp.customer?.district ||
          p.store?.district ||
          "",
        subdistrict:
          dedicatedResult?.subdistrict ||
          dp.ownerSubdistrict ||
          p.subdistrict ||
          "",
        cropName: dp.cropName || dp.customCropName || dp.cropCategory || p.cropName || "",
        customCropName: dp.customCropName || p.customCropName || null,
        cropCategory: dp.cropCategory || p.cropCategory || "",
        areaRai: dp.areaRai != null ? Number(dp.areaRai) : (p.areaRai != null ? Number(p.areaRai) : null),
        treeCount: dp.treeCount != null ? Number(dp.treeCount) : (p.treeCount != null ? Number(p.treeCount) : null),
        objective: dp.objective || p.objective || "",
        categoryId: dp.categoryId || p.categoryId || null,
        latitude:
          dedicatedResult?.latitude != null
            ? Number(dedicatedResult.latitude)
            : dp.latitude != null
            ? Number(dp.latitude)
            : null,
        longitude:
          dedicatedResult?.longitude != null
            ? Number(dedicatedResult.longitude)
            : dp.longitude != null
            ? Number(dp.longitude)
            : null,
        // Actual outcome fields
        mainCropInfo: dedicatedResult?.mainCropInfo || dp.mainCropInfo || p.mainCropInfo || "",
        experimentDetail: dedicatedResult?.experimentDetail || dp.experimentDetail || p.experimentDetail || "",
        irrigations:
          Array.isArray(dedicatedResult?.irrigations) && dedicatedResult.irrigations.length > 0
            ? dedicatedResult.irrigations.map((i: any) => typeof i === "string" ? i : i.method).filter(Boolean)
            : (dp.irrigations || p.irrigations || []).map((i: any) => typeof i === "string" ? i : i.method).filter(Boolean),
        plantingDate: dedicatedResult?.plantingDate || dp.plantingDate || p.plantingDate || dp.startDate || null,
        initialSprayDate: dedicatedResult?.firstSprayDate || dp.initialSprayDate || p.initialSprayDate || null,
        nextSprayDate: dedicatedResult?.nextSprayDate || dp.nextSprayDate || p.nextSprayDate || null,
        cropAgeValue: dedicatedResult?.cropAgeValue ?? visit1?.cropAgeValue ?? dp.cropAgeValue ?? null,
        cropAgeUnit: dedicatedResult?.cropAgeUnit || visit1?.cropAgeUnit || dp.cropAgeUnit || "วัน",
        growthStage: dedicatedResult?.growthStage || visit1?.growthStage || dp.growthStage || null,
        sprayMethod: dedicatedResult?.sprayMethod || dp.sprayMethod || visit1?.sprayMethod || p.sprayMethod || "SINGLE",
        sprayEquipment: dedicatedResult?.sprayEquipment || dp.sprayEquipment || visit1?.sprayEquipment || p.sprayEquipment || null,
        otherEquipment: dedicatedResult?.otherEquipment || dp.otherEquipment || visit1?.otherEquipment || p.otherEquipment || null,
        hasExternalChemicals: Boolean(dedicatedResult?.hasExternalChemicals ?? dp.hasExternalChemicals ?? p.hasExternalChemicals),
        externalProducts:
          Array.isArray(dedicatedResult?.sprayExternals) && dedicatedResult.sprayExternals.length > 0
            ? dedicatedResult.sprayExternals
            : dp.externalProducts || p.externalProducts || [],
        notes: dedicatedResult?.notes || dp.notes || visit1?.notes || p.notes || null,
        visits: dp.visits || p.visits || [],
        attachments:
          Array.isArray(dedicatedResult?.attachments) && dedicatedResult.attachments.length > 0
            ? dedicatedResult.attachments
            : dp.attachments || p.attachments || [],
        demoProducts: rawProducts.map((prod: any) => ({
          ...prod,
          id: prod.id,
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
          withdrawnQuantity:
            prod.withdrawnQuantity != null
              ? Number(prod.withdrawnQuantity)
              : prod.quantity != null
                ? Number(prod.quantity)
                : 1,
          actualQuantity:
            prod.actualQuantity != null
              ? Number(prod.actualQuantity)
              : prod.quantity != null
                ? Number(prod.quantity)
                : 1,
          extraQuantity: prod.extraQuantity != null ? String(prod.extraQuantity) : "",
          extraUnit: prod.extraUnit || (prod.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
          applicationRate: prod.applicationRate || "",
          isAdditional: Boolean(prod.isAdditional),
        })),
      };
    });
  } else if (plan.demoPlotData || plan.demoPlot) {
    const dp = plan.demoPlotData || plan.demoPlot;
    const rawProducts = dp.demoProducts?.length ? dp.demoProducts : (plan.demoProducts || []);
    const visit1 = dp.visits?.[0];

    list = [
      {
        id: dp.id,
        demoPlotId: dp.id,
        demoPlot: dp,
        plotName: dp.plotName || dp.name,
        ownerName: dp.ownerName || dp.farmerName,
        farmerName: dp.farmerName || dp.ownerName,
        farmerCustomerId: dp.farmerCustomerId,
        farmerPhone: formatPhoneNumber(dp.ownerPhone || dp.farmerCustomer?.phone || ""), 
        isUnregisteredFarmer: dp.isUnregisteredFarmer != null ? Boolean(dp.isUnregisteredFarmer) : false,
        storeId: dp.storeId || dp.customerId,
        dealerName: dp.customer?.name || "",
        dealerCode: dp.customer?.customerCode || "",
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
        mainCropInfo: dp.mainCropInfo || "",
        experimentDetail: dp.experimentDetail || "",
        irrigations: (dp.irrigations || []).map((i: any) => typeof i === "string" ? i : i.method).filter(Boolean),
        plantingDate: dp.plantingDate || dp.startDate || null,
        initialSprayDate: dp.initialSprayDate || null,
        nextSprayDate: dp.nextSprayDate || null,
        cropAgeValue: visit1?.cropAgeValue ?? dp.cropAgeValue ?? null,
        cropAgeUnit: visit1?.cropAgeUnit ?? dp.cropAgeUnit ?? "วัน",
        growthStage: visit1?.growthStage ?? dp.growthStage ?? null,
        sprayMethod: dp.sprayMethod || visit1?.sprayMethod || "SINGLE",
        sprayEquipment: dp.sprayEquipment || visit1?.sprayEquipment || null,
        otherEquipment: dp.otherEquipment || visit1?.otherEquipment || null,
        hasExternalChemicals: Boolean(dp.hasExternalChemicals),
        externalProducts: dp.externalProducts || [],
        notes: dp.notes || visit1?.notes || null,
        visits: dp.visits || [],
        attachments: dp.attachments || [],
        demoProducts: rawProducts.map((prod: any) => ({
          ...prod,
          id: prod.id,
          productId: prod.productId || prod.product?.id,
          productName: prod.productName || prod.product?.name,
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
          withdrawnQuantity:
            prod.withdrawnQuantity != null
              ? Number(prod.withdrawnQuantity)
              : prod.quantity != null
                ? Number(prod.quantity)
                : 1,
          actualQuantity:
            prod.actualQuantity != null
              ? Number(prod.actualQuantity)
              : prod.quantity != null
                ? Number(prod.quantity)
                : 1,
          extraQuantity: prod.extraQuantity != null ? String(prod.extraQuantity) : "",
          extraUnit: prod.extraUnit || (prod.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
          applicationRate: prod.applicationRate || "",
          isAdditional: Boolean(prod.isAdditional),
        })),
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

  const sourcePlots =
    Array.isArray(initialData.type7aTargets) && initialData.type7aTargets.length > 0
      ? initialData.type7aTargets
      : Array.isArray(initialData.type7aPlots) && initialData.type7aPlots.length > 0
      ? initialData.type7aPlots
      : null;

  if (sourcePlots && sourcePlots.length > 0) {
    return sourcePlots.map((p: any, idx: number) => {
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
        farmerName: p.farmerName || p.ownerName || p.customer?.name || p.store?.name || p.dealerName || "",
        ownerName: p.ownerName || p.farmerName || p.customer?.name || p.store?.name || p.dealerName || "",
        ownerPhone: formatPhoneNumber(p.ownerPhone || p.farmerPhone || p.farmerCustomer?.phone || ""),
        storeId: p.storeId || p.customerId || p.store?.id || null,
        dealerName: p.dealerName || p.store?.name || "",
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
        ownerPhone: formatPhoneNumber(d.ownerPhone || ""), 
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
