import type { Type7aActualRecord } from "../types/actual.types";

/**
 * Parse raw activity result into structured Type7aActualRecord
 */
export function parseType7aActualResult(rawResult: any): Type7aActualRecord {
  if (!rawResult) return {};

  const dedicated7a =
    rawResult.type7aResults?.[0] ||
    rawResult.activityPlan?.type7aResults?.[0];

  const dp =
    rawResult.demoPlot ||
    rawResult.activityPlan?.type7aPlots?.[0]?.demoPlot ||
    rawResult.activityPlan?.type7aPlots?.[0] ||
    rawResult.type7aPlots?.[0]?.demoPlot ||
    rawResult.type7aPlots?.[0] ||
    rawResult.activityPlan?.demoPlots?.[0] ||
    rawResult.demoPlots?.[0] ||
    null;

  const demoItems = rawResult.demoResults || rawResult.activityResultDemoItems || [];
  const visit1 = dp?.visits?.[0];

  // Helper date formatter
  const toDateStr = (d: any) => {
    if (!d) return undefined;
    if (typeof d === "string") return d.split("T")[0];
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return undefined;
  };

  // Planned & Additional products from dedicated7a.actualProducts or demoPlot.demoProducts
  const dedicatedPlanned = (dedicated7a?.actualProducts || [])
    .filter((p: any) => p.isPlanned)
    .map((p: any) => ({
      productId: p.productId || p.product?.id || "",
      productName: p.productName || p.product?.name || "",
      withdrawnQuantity: p.withdrawnQuantity != null ? Number(p.withdrawnQuantity) : 1,
      actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 1,
      extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
      extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
      applicationRate: p.actualRate || "",
    }));

  const dedicatedAdditional = (dedicated7a?.actualProducts || [])
    .filter((p: any) => !p.isPlanned)
    .map((p: any, idx: number) => ({
      id: p.id || `add-${idx}`,
      productId: p.productId || p.product?.id || "",
      productName: p.productName || p.product?.name || "",
      actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 1,
      extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
      extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
      applicationRate: p.actualRate || "",
    }));

  const demoProds = dp?.demoProducts || [];
  const plannedFromDemo = dedicatedPlanned.length > 0 ? dedicatedPlanned : demoProds
    .filter((p: any) => !p.isAdditional)
    .map((p: any) => ({
      productId: p.productId || p.product?.id || "",
      productName: p.productName || p.product?.name || "",
      withdrawnQuantity:
        p.withdrawnQuantity != null
          ? Number(p.withdrawnQuantity)
          : p.quantity != null
            ? Number(p.quantity)
            : 1,
      actualQuantity:
        p.quantity != null
          ? Number(p.quantity)
          : p.withdrawnQuantity != null
            ? Number(p.withdrawnQuantity)
            : 1,
      extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
      extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
      applicationRate: p.applicationRate || "",
    }));

  const additionalFromDemo = dedicatedAdditional.length > 0 ? dedicatedAdditional : demoProds
    .filter((p: any) => p.isAdditional)
    .map((p: any, idx: number) => ({
      id: p.id || `add-${idx}`,
      productId: p.productId || p.product?.id || "",
      productName: p.productName || p.product?.name || "",
      actualQuantity: p.quantity != null ? Number(p.quantity) : 1,
      extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
      extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
      applicationRate: p.applicationRate || "",
    }));

  // Initial photos from visits or attachments
  const visitPhotos = visit1?.plotImageUrls || visit1?.imageUrls || [];
  const photoAttachments = Array.isArray(dp?.attachments)
    ? dp.attachments
        .filter((a: any) => a.workTypeCode === "TYPE_7A" || a.category === "PLOT" || a.category === "INITIAL")
        .map((a: any) => ({ id: a.id, url: a.fileUrl || a.url, name: a.fileName || a.name }))
    : [];

  const initialPhotos =
    rawResult.initialPhotos ||
    rawResult.t7InitialPhotos ||
    (visitPhotos.length > 0
      ? visitPhotos.map((url: string, idx: number) => ({ id: `img-${idx}`, url, name: "รูปถ่ายแปลงสาธิต" }))
      : photoAttachments);

  // Irrigations
  const rawIrrigations = rawResult.irrigations || rawResult.t7Irrigations || dp?.irrigations || [];
  const parsedIrrigations = Array.isArray(rawIrrigations)
    ? rawIrrigations.map((i: any) => (typeof i === "string" ? i : i.method)).filter(Boolean)
    : [];

  return {
    t7SelectedProvince:
      rawResult.selectedProvince ||
      rawResult.t7SelectedProvince ||
      rawResult.farmerProvince ||
      dp?.ownerProvince ||
      dp?.province ||
      dp?.customer?.province,
    t7FarmerProvince:
      rawResult.farmerProvince ||
      rawResult.t7FarmerProvince ||
      rawResult.province ||
      dp?.ownerProvince ||
      dp?.province ||
      dp?.customer?.province,
    t7FarmerDistrict:
      rawResult.farmerDistrict ||
      rawResult.t7FarmerDistrict ||
      rawResult.district ||
      dp?.ownerDistrict ||
      dp?.district ||
      dp?.customer?.district,
    t7FarmerSubdistrict:
      rawResult.farmerSubdistrict ||
      rawResult.t7FarmerSubdistrict ||
      rawResult.ownerSubdistrict ||
      rawResult.subdistrict ||
      dp?.ownerSubdistrict,
    t7FarmerCustomerId:
      rawResult.farmerCustomerId ||
      rawResult.t7FarmerCustomerId ||
      dp?.farmerCustomerId,
    t7FarmerName:
      rawResult.farmerName ||
      rawResult.t7FarmerName ||
      rawResult.ownerName ||
      dp?.ownerName ||
      dp?.farmerCustomer?.name,
    t7FarmerPhone:
      rawResult.farmerPhone ||
      rawResult.t7FarmerPhone ||
      rawResult.ownerPhone ||
      dp?.ownerPhone ||
      dp?.farmerCustomer?.phone,
    t7IsUnregisteredFarmer: Boolean(
      rawResult.isUnregisteredFarmer ?? rawResult.t7IsUnregisteredFarmer ?? dp?.isUnregisteredFarmer,
    ),
    t7DealerName:
      rawResult.dealerName ||
      rawResult.t7DealerName ||
      rawResult.storeName ||
      dp?.customer?.name,
    t7DealerCode:
      rawResult.dealerCode ||
      rawResult.t7DealerCode ||
      dp?.customer?.customerCode,
    t7Latitude:
      rawResult.latitude != null
        ? Number(rawResult.latitude)
        : rawResult.t7Latitude != null
          ? Number(rawResult.t7Latitude)
          : dp?.latitude != null
            ? Number(dp.latitude)
            : undefined,
    t7Longitude:
      rawResult.longitude != null
        ? Number(rawResult.longitude)
        : rawResult.t7Longitude != null
          ? Number(rawResult.t7Longitude)
          : dp?.longitude != null
            ? Number(dp.longitude)
            : undefined,
    t7PlotName:
      rawResult.plotName ||
      rawResult.t7PlotName ||
      dp?.name,
    t7District:
      rawResult.district ||
      rawResult.t7District ||
      dp?.district,
    t7CropCategory:
      rawResult.cropCategory ||
      rawResult.t7CropCategory ||
      dp?.cropCategory,
    t7CropName:
      rawResult.cropName ||
      rawResult.t7CropName ||
      dp?.cropName,
    t7CustomCropName:
      rawResult.customCropName ||
      rawResult.t7CustomCropName ||
      dp?.customCropName,
    t7AreaRai:
      rawResult.areaRai != null
        ? rawResult.areaRai
        : rawResult.t7AreaRai != null
          ? rawResult.t7AreaRai
          : dp?.areaRai != null
            ? Number(dp.areaRai)
            : undefined,
    t7TreeCount:
      rawResult.treeCount != null
        ? rawResult.treeCount
        : rawResult.t7TreeCount != null
          ? rawResult.t7TreeCount
          : dp?.treeCount != null
            ? Number(dp.treeCount)
            : undefined,
    t7PlotObjective:
      rawResult.plotObjective ||
      rawResult.t7PlotObjective ||
      rawResult.objective ||
      dp?.objective,
    t7ExperimentDetail:
      rawResult.experimentDetail ||
      rawResult.t7ExperimentDetail ||
      dp?.experimentDetail,
    t7MainCropInfo:
      rawResult.mainCropInfo ||
      rawResult.t7MainCropInfo ||
      dp?.mainCropInfo,
    t7Irrigations: parsedIrrigations,
    t7PlantingDate:
      toDateStr(rawResult.plantingDate) ||
      toDateStr(rawResult.t7PlantingDate) ||
      toDateStr(dp?.plantingDate) ||
      toDateStr(dp?.startDate),
    t7InitialSprayDate:
      toDateStr(rawResult.initialSprayDate) ||
      toDateStr(rawResult.t7InitialSprayDate) ||
      toDateStr(dp?.initialSprayDate),
    t7NextSprayDate:
      toDateStr(rawResult.nextSprayDate) ||
      toDateStr(rawResult.t7NextSprayDate) ||
      toDateStr(dp?.nextSprayDate),
    t7NextFollowUpDate:
      toDateStr(rawResult.nextFollowUpDate) ||
      toDateStr(rawResult.t7NextFollowUpDate),
    t7CropAgeValue:
      rawResult.cropAgeValue != null
        ? rawResult.cropAgeValue
        : rawResult.t7CropAgeValue != null
          ? rawResult.t7CropAgeValue
          : visit1?.cropAgeValue != null
            ? visit1.cropAgeValue
            : undefined,
    t7CropAgeUnit:
      rawResult.cropAgeUnit ||
      rawResult.t7CropAgeUnit ||
      visit1?.cropAgeUnit ||
      "วัน",
    t7GrowthStage:
      rawResult.growthStage ||
      rawResult.t7GrowthStage ||
      visit1?.growthStage,
    t7CropCondition:
      rawResult.cropCondition ||
      rawResult.t7CropCondition,
    t7CropProblemDesc:
      rawResult.cropProblemDesc ||
      rawResult.t7CropProblemDesc,
    t7ProductResponse:
      rawResult.productResponse ||
      rawResult.t7ProductResponse,
    t7DemoProducts:
      rawResult.demoProducts ||
      rawResult.t7DemoProducts ||
      dp?.demoProducts ||
      [],
    t7SprayMethod:
      rawResult.sprayMethod ||
      rawResult.t7SprayMethod ||
      dp?.sprayMethod ||
      visit1?.sprayMethod ||
      "SINGLE",
    t7SprayEquipment:
      rawResult.sprayEquipment ||
      rawResult.t7SprayEquipment ||
      dp?.sprayEquipment ||
      visit1?.sprayEquipment,
    t7OtherEquipment:
      rawResult.otherEquipment ||
      rawResult.t7OtherEquipment ||
      dp?.otherEquipment ||
      visit1?.otherEquipment,
    t7HasExternalChemicals: Boolean(
      rawResult.hasExternalChemicals ??
        rawResult.t7HasExternalChemicals ??
        dp?.hasExternalChemicals,
    ),
    t7ExternalProducts:
      rawResult.externalProducts ||
      rawResult.t7ExternalProducts ||
      dp?.externalProducts ||
      [],
    t7PlannedProducts:
      rawResult.plannedProducts ||
      rawResult.t7PlannedProducts ||
      plannedFromDemo,
    t7AdditionalProducts:
      rawResult.additionalProducts ||
      rawResult.t7AdditionalProducts ||
      additionalFromDemo,
    t7InitialPhotos: initialPhotos,
    t7PlotImages: rawResult.plotImages || rawResult.t7PlotImages || [],
    t7CropImages: rawResult.cropImages || rawResult.t7CropImages || [],
    t7UsageMethod: rawResult.usageMethod || rawResult.t7UsageMethod,
    t7PlantingAreaCondition:
      rawResult.plantingAreaCondition ||
      rawResult.t7PlantingAreaCondition,
    t7Notes:
      rawResult.notes ||
      rawResult.t7Notes ||
      dp?.notes ||
      visit1?.notes,
    t7DemoPlotId:
      rawResult.demoPlotId ||
      rawResult.t7DemoPlotId ||
      dp?.id,
    t7DemoResults: demoItems,
    t7PlotStatus:
      rawResult.plotStatus ||
      rawResult.t7PlotStatus ||
      dp?.status ||
      "IN_PROGRESS",
    t7FinalYieldKg: rawResult.finalYieldKg || rawResult.t7FinalYieldKg,
    t7ControlYieldKg: rawResult.controlYieldKg || rawResult.t7ControlYieldKg,
    t7YieldIncreasePercent:
      rawResult.yieldIncreasePercent || rawResult.t7YieldIncreasePercent,
    t7FarmerSatisfaction:
      rawResult.farmerSatisfaction || rawResult.t7FarmerSatisfaction,
  };
}
