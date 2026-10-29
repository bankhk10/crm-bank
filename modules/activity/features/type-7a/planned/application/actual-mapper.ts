import type { Type7aActualRecord } from "../types/actual.types";
import { formatPhoneNumber } from "../../shared/utils";

/**
 * Parse raw activity result into structured Type7aActualRecord
 * Fully supports 100% Dedicated Relational Storage (ActivityResultType7a,
 * ActivityResultType7aProduct, ActivityResultType7aIrrigation,
 * ActivityResultType7aExternal, ActivityAttachment) as well as
 * Master Asset fallback (DemoPlot, DemoPlotProduct, DemoPlotIrrigation,
 * DemoPlotExternalProduct, DemoPlotVisit).
 */
export function parseType7aActualResult(rawResult: any): Type7aActualRecord {
  if (!rawResult) return {};

  // 1. Resolve Dedicated ActivityResultType7a record
  const dedicated7a =
    rawResult.type7aResults?.[0] ||
    rawResult.activityPlan?.type7aResults?.[0] ||
    rawResult.type7aTargets?.[0]?.results?.[0] ||
    rawResult.targets?.[0]?.results?.[0] ||
    rawResult.type7aPlots?.[0]?.type7aResults?.[0] ||
    // In case rawResult itself is already the ActivityResultType7a record
    (rawResult.farmerName !== undefined ||
    rawResult.plantingDate !== undefined ||
    rawResult.sprayEquipment !== undefined
      ? rawResult
      : null);

  // 1.5. Resolve Target record (ActivityPlanType7aTarget)
  const target =
    dedicated7a?.target ||
    rawResult.type7aTargets?.[0] ||
    rawResult.activityPlan?.type7aTargets?.[0] ||
    rawResult.targets?.[0] ||
    null;

  // 2. Resolve Master DemoPlot / Target record
  const dp =
    target ||
    rawResult.demoPlot ||
    rawResult.activityPlan?.type7aPlots?.[0]?.demoPlot ||
    rawResult.activityPlan?.type7aPlots?.[0] ||
    rawResult.type7aPlots?.[0]?.demoPlot ||
    rawResult.type7aPlots?.[0] ||
    rawResult.type7aTargets?.[0]?.demoPlot ||
    rawResult.activityPlan?.demoPlots?.[0] ||
    rawResult.demoPlots?.[0] ||
    null;

  const demoItems =
    rawResult.demoResults || rawResult.activityResultDemoItems || [];
  const visit1 = dp?.visits?.[0] || rawResult.visits?.[0] || null;

  // Helper date formatter
  const toDateStr = (d: any) => {
    if (!d) return undefined;
    if (typeof d === "string") return d.split("T")[0];
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return undefined;
  };

  // 3. Planned & Additional products from dedicated7a.actualProducts or demoPlot.demoProducts
  const dedicatedPlanned = (dedicated7a?.actualProducts || [])
    .filter((p: any) => p.isPlanned)
    .map((p: any) => ({
      productId: p.productId || p.product?.id || "",
      productName: p.productName || p.product?.name || "",
      withdrawnQuantity:
        p.withdrawnQuantity != null ? Number(p.withdrawnQuantity) : 1,
      actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 1,
      extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
      extraUnit:
        p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
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
      extraUnit:
        p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
      applicationRate: p.actualRate || "",
    }));

  const demoProds = dp?.demoProducts || target?.products || [];
  const plannedFromDemo =
    dedicatedPlanned.length > 0
      ? dedicatedPlanned
      : demoProds.length > 0
        ? demoProds
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
                p.actualQuantity != null
                  ? Number(p.actualQuantity)
                  : p.quantity != null
                    ? Number(p.quantity)
                    : p.withdrawnQuantity != null
                      ? Number(p.withdrawnQuantity)
                      : 1,
              extraQuantity:
                p.extraQuantity != null ? String(p.extraQuantity) : "",
              extraUnit:
                p.extraUnit ||
                (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
              applicationRate: p.applicationRate || "",
            }))
        : // Fallback to planned products from plan if no actual products recorded yet
          (
            target?.products ||
            rawResult.type7aProducts ||
            rawResult.activityPlan?.type7aProducts ||
            []
          ).map((p: any) => ({
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "",
            withdrawnQuantity: p.quantity != null ? Number(p.quantity) : 1,
            actualQuantity: p.quantity != null ? Number(p.quantity) : 1,
            extraQuantity: "",
            extraUnit: p.unit?.includes("ซอง") ? "กรัม" : "ซีซี",
            applicationRate: "",
          }));

  const additionalFromDemo =
    dedicatedAdditional.length > 0
      ? dedicatedAdditional
      : demoProds
          .filter((p: any) => p.isAdditional)
          .map((p: any, idx: number) => ({
            id: p.id || `add-${idx}`,
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "",
            actualQuantity: p.quantity != null ? Number(p.quantity) : 1,
            extraQuantity:
              p.extraQuantity != null ? String(p.extraQuantity) : "",
            extraUnit:
              p.extraUnit ||
              (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
            applicationRate: p.applicationRate || "",
          }));

  // 4. Photos from dedicated attachments, visits, or dp attachments
  const visitPhotos = visit1?.plotImageUrls || visit1?.imageUrls || [];
  const dedicatedAttachments = Array.isArray(dedicated7a?.attachments)
    ? dedicated7a.attachments
        .filter(
          (a: any) =>
            a.category === "PLOT" ||
            a.category === "INITIAL" ||
            a.workTypeCode === "TYPE_7A" ||
            !a.category,
        )
        .map((a: any) => ({
          id: a.id,
          url: a.fileUrl || a.url,
          name: a.fileName || a.name || "รูปถ่ายสภาพแปลง",
        }))
    : [];

  const photoAttachments = Array.isArray(dp?.attachments)
    ? dp.attachments
        .filter(
          (a: any) =>
            a.workTypeCode === "TYPE_7A" ||
            a.category === "PLOT" ||
            a.category === "INITIAL" ||
            !a.category,
        )
        .map((a: any) => ({
          id: a.id,
          url: a.fileUrl || a.url,
          name: a.fileName || a.name,
        }))
    : [];

  const initialPhotos =
    (dedicatedAttachments.length > 0 ? dedicatedAttachments : null) ||
    rawResult.initialPhotos ||
    rawResult.t7InitialPhotos ||
    (photoAttachments.length > 0 ? photoAttachments : null) ||
    (visitPhotos.length > 0
      ? visitPhotos.map((url: string, idx: number) => ({
          id: `img-${idx}`,
          url,
          name: `รูปถ่ายแปลงสาธิต ${idx + 1}`,
        }))
      : []);

  // 5. Irrigations (Dedicated -> DP -> Raw)
  const dedicatedIrrigations = Array.isArray(dedicated7a?.irrigations)
    ? dedicated7a.irrigations
        .map((i: any) => (typeof i === "string" ? i : i.method))
        .filter(Boolean)
    : [];

  const rawIrrigations =
    (dedicatedIrrigations.length > 0 ? dedicatedIrrigations : null) ||
    rawResult.irrigations ||
    rawResult.t7Irrigations ||
    dp?.irrigations ||
    [];

  const parsedIrrigations = Array.isArray(rawIrrigations)
    ? rawIrrigations
        .map((i: any) => (typeof i === "string" ? i : i.method))
        .filter(Boolean)
    : [];

  // 6. External Chemicals (Dedicated -> DP -> Raw)
  const dedicatedExternals = Array.isArray(dedicated7a?.sprayExternals)
    ? dedicated7a.sprayExternals.map((ext: any, idx: number) => ({
        id: ext.id || `ext-${idx}`,
        company: ext.company || "",
        productName: ext.productName || "",
        activeIngredient: ext.activeIngredient || "",
        formula: ext.formula || "SL",
        customFormula: ext.customFormula || "",
        applicationRate: ext.applicationRate || "",
      }))
    : [];

  const parsedExternalProducts =
    dedicatedExternals.length > 0
      ? dedicatedExternals
      : rawResult.externalProducts ||
        rawResult.t7ExternalProducts ||
        dp?.externalProducts ||
        [];

  return {
    t7SelectedProvince:
      rawResult.selectedProvince ||
      rawResult.t7SelectedProvince ||
      dedicated7a?.province ||
      rawResult.farmerProvince ||
      target?.store?.province ||
      target?.province ||
      dp?.province ||
      dp?.ownerProvince ||
      dp?.customer?.province ||
      "",
    t7FarmerProvince:
      rawResult.farmerProvince ||
      rawResult.t7FarmerProvince ||
      dedicated7a?.province ||
      rawResult.province ||
      target?.store?.province ||
      target?.province ||
      dp?.province ||
      dp?.ownerProvince ||
      dp?.customer?.province ||
      "",
    t7FarmerDistrict:
      rawResult.farmerDistrict ||
      rawResult.t7FarmerDistrict ||
      dedicated7a?.district ||
      rawResult.district ||
      target?.store?.district ||
      target?.district ||
      dp?.district ||
      dp?.ownerDistrict ||
      dp?.customer?.district ||
      "",
    t7FarmerSubdistrict:
      rawResult.farmerSubdistrict ||
      rawResult.t7FarmerSubdistrict ||
      dedicated7a?.subdistrict ||
      rawResult.ownerSubdistrict ||
      rawResult.subdistrict ||
      target?.subdistrict ||
      dp?.ownerSubdistrict ||
      "",
    t7FarmerCustomerId:
      rawResult.farmerCustomerId ||
      rawResult.t7FarmerCustomerId ||
      dedicated7a?.farmerCustomerId ||
      target?.farmerCustomerId ||
      dp?.farmerCustomerId ||
      null,
    t7FarmerName:
      rawResult.farmerName ||
      rawResult.t7FarmerName ||
      dedicated7a?.farmerName ||
      rawResult.ownerName ||
      target?.farmerName ||
      target?.ownerName ||
      dp?.ownerName ||
      dp?.farmerCustomer?.name ||
      "",
    t7FarmerPhone: formatPhoneNumber(
      rawResult.farmerPhone ||
        rawResult.t7FarmerPhone ||
        dedicated7a?.farmerPhone ||
        rawResult.ownerPhone ||
        target?.farmerPhone ||
        dp?.ownerPhone ||
        dp?.farmerCustomer?.phone ||
        "",
    ),
    t7IsUnregisteredFarmer: Boolean(
      rawResult.isUnregisteredFarmer ??
      rawResult.t7IsUnregisteredFarmer ??
      dedicated7a?.isUnregisteredFarmer ??
      target?.isUnregisteredFarmer ??
      dp?.isUnregisteredFarmer,
    ),
    t7DealerName:
      rawResult.dealerName ||
      rawResult.t7DealerName ||
      rawResult.storeName ||
      target?.store?.name ||
      target?.dealerName ||
      dp?.customer?.name ||
      rawResult.store?.name ||
      "",
    t7DealerCode:
      rawResult.dealerCode ||
      rawResult.t7DealerCode ||
      target?.store?.customerCode ||
      target?.dealerCode ||
      dp?.customer?.customerCode ||
      rawResult.store?.customerCode ||
      "",
    t7Latitude:
      dedicated7a?.latitude != null
        ? Number(dedicated7a.latitude)
        : rawResult.latitude != null
          ? Number(rawResult.latitude)
          : rawResult.t7Latitude != null
            ? Number(rawResult.t7Latitude)
            : target?.latitude != null
              ? Number(target.latitude)
              : dp?.latitude != null
                ? Number(dp.latitude)
                : undefined,
    t7Longitude:
      dedicated7a?.longitude != null
        ? Number(dedicated7a.longitude)
        : rawResult.longitude != null
          ? Number(rawResult.longitude)
          : rawResult.t7Longitude != null
            ? Number(rawResult.t7Longitude)
            : target?.longitude != null
              ? Number(target.longitude)
              : dp?.longitude != null
                ? Number(dp.longitude)
                : undefined,
    t7PlotName:
      rawResult.plotName ||
      rawResult.t7PlotName ||
      target?.plotName ||
      target?.name ||
      dp?.name ||
      "",
    t7District:
      dedicated7a?.district ||
      rawResult.district ||
      rawResult.t7District ||
      target?.store?.district ||
      target?.district ||
      dp?.district ||
      "",
    t7CropCategory:
      target?.cropCategory ||
      dp?.cropCategory ||
      rawResult.cropCategory ||
      rawResult.t7CropCategory ||
      "",
    t7CropName:
      target?.cropName ||
      dp?.cropName ||
      rawResult.cropName ||
      rawResult.t7CropName ||
      "",
    t7CustomCropName:
      target?.customCropName ||
      dp?.customCropName ||
      rawResult.customCropName ||
      rawResult.t7CustomCropName ||
      "",
    t7AreaRai:
      target?.areaRai != null
        ? Number(target.areaRai)
        : dp?.areaRai != null
          ? Number(dp.areaRai)
          : rawResult.areaRai != null
            ? rawResult.areaRai
            : rawResult.t7AreaRai != null
              ? rawResult.t7AreaRai
              : undefined,
    t7TreeCount:
      target?.treeCount != null
        ? Number(target.treeCount)
        : dp?.treeCount != null
          ? Number(dp.treeCount)
          : rawResult.treeCount != null
            ? rawResult.treeCount
            : rawResult.t7TreeCount != null
              ? rawResult.t7TreeCount
              : undefined,
    t7PlotObjective:
      target?.objective ||
      dp?.objective ||
      rawResult.plotObjective ||
      rawResult.t7PlotObjective ||
      rawResult.objective ||
      "",
    t7ExperimentDetail:
      dedicated7a?.experimentDetail ||
      dp?.experimentDetail ||
      rawResult.experimentDetail ||
      rawResult.t7ExperimentDetail ||
      "",
    t7MainCropInfo:
      dedicated7a?.mainCropInfo ||
      rawResult.mainCropInfo ||
      rawResult.t7MainCropInfo ||
      dp?.mainCropInfo ||
      "",
    t7Irrigations: parsedIrrigations,
    t7PlantingDate:
      toDateStr(dedicated7a?.plantingDate) ||
      toDateStr(rawResult.plantingDate) ||
      toDateStr(rawResult.t7PlantingDate) ||
      toDateStr(dp?.plantingDate) ||
      toDateStr(dp?.startDate) ||
      "",
    t7InitialSprayDate:
      toDateStr(dedicated7a?.firstSprayDate) ||
      toDateStr(rawResult.initialSprayDate) ||
      toDateStr(rawResult.t7InitialSprayDate) ||
      toDateStr(dp?.initialSprayDate) ||
      "",
    t7NextSprayDate:
      toDateStr(dedicated7a?.nextSprayDate) ||
      toDateStr(rawResult.nextSprayDate) ||
      toDateStr(rawResult.t7NextSprayDate) ||
      toDateStr(dp?.nextSprayDate) ||
      "",
    t7NextFollowUpDate:
      toDateStr(rawResult.nextFollowUpDate) ||
      toDateStr(rawResult.t7NextFollowUpDate) ||
      "",
    t7CropAgeValue:
      dedicated7a?.cropAgeValue != null
        ? dedicated7a.cropAgeValue
        : rawResult.cropAgeValue != null
          ? rawResult.cropAgeValue
          : rawResult.t7CropAgeValue != null
            ? rawResult.t7CropAgeValue
            : visit1?.cropAgeValue != null
              ? visit1.cropAgeValue
              : undefined,
    t7CropAgeUnit:
      dedicated7a?.cropAgeUnit ||
      rawResult.cropAgeUnit ||
      rawResult.t7CropAgeUnit ||
      visit1?.cropAgeUnit ||
      "วัน",
    t7GrowthStage:
      dedicated7a?.growthStage ||
      rawResult.growthStage ||
      rawResult.t7GrowthStage ||
      visit1?.growthStage ||
      "",
    t7CropCondition: rawResult.cropCondition || rawResult.t7CropCondition,
    t7CropProblemDesc: rawResult.cropProblemDesc || rawResult.t7CropProblemDesc,
    t7ProductResponse: rawResult.productResponse || rawResult.t7ProductResponse,
    t7DemoProducts:
      rawResult.demoProducts ||
      rawResult.t7DemoProducts ||
      dp?.demoProducts ||
      [],
    t7SprayMethod:
      dedicated7a?.sprayMethod ||
      rawResult.sprayMethod ||
      rawResult.t7SprayMethod ||
      dp?.sprayMethod ||
      visit1?.sprayMethod ||
      "SINGLE",
    t7SprayEquipment:
      dedicated7a?.sprayEquipment ||
      rawResult.sprayEquipment ||
      rawResult.t7SprayEquipment ||
      dp?.sprayEquipment ||
      visit1?.sprayEquipment ||
      "เป้สะพายหลัง",
    t7OtherEquipment:
      dedicated7a?.otherEquipment ||
      rawResult.otherEquipment ||
      rawResult.t7OtherEquipment ||
      dp?.otherEquipment ||
      visit1?.otherEquipment ||
      "",
    t7HasExternalChemicals: Boolean(
      dedicated7a?.hasExternalChemicals ??
      rawResult.hasExternalChemicals ??
      rawResult.t7HasExternalChemicals ??
      dp?.hasExternalChemicals,
    ),
    t7ExternalProducts: parsedExternalProducts,
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
      rawResult.plantingAreaCondition || rawResult.t7PlantingAreaCondition,
    t7Notes:
      dedicated7a?.notes ||
      rawResult.notes ||
      rawResult.t7Notes ||
      dp?.notes ||
      visit1?.notes ||
      "",
    t7DemoPlotId:
      dedicated7a?.demoPlotId ||
      rawResult.demoPlotId ||
      rawResult.t7DemoPlotId ||
      dp?.id ||
      null,
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
