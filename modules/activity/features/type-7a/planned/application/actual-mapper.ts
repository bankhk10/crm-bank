import type { Type7aActualRecord } from "../types/actual.types";

/**
 * Parse raw activity result into structured Type7aActualRecord
 */
export function parseType7aActualResult(rawResult: any): Type7aActualRecord {
  if (!rawResult) return {};

  const demoItems = rawResult.demoResults || rawResult.activityResultDemoItems || [];

  return {
    t7FarmerProvince: rawResult.farmerProvince || rawResult.province,
    t7FarmerDistrict: rawResult.farmerDistrict || rawResult.district,
    t7FarmerCustomerId: rawResult.farmerCustomerId,
    t7FarmerName: rawResult.farmerName || rawResult.ownerName,
    t7FarmerPhone: rawResult.farmerPhone || rawResult.ownerPhone,
    t7IsUnregisteredFarmer: Boolean(rawResult.isUnregisteredFarmer),
    t7DealerName: rawResult.dealerName || rawResult.storeName,
    t7DealerCode: rawResult.dealerCode,
    t7Latitude: rawResult.latitude ? Number(rawResult.latitude) : undefined,
    t7Longitude: rawResult.longitude ? Number(rawResult.longitude) : undefined,
    t7PlotName: rawResult.plotName,
    t7District: rawResult.district,
    t7CropCategory: rawResult.cropCategory,
    t7CropName: rawResult.cropName,
    t7CustomCropName: rawResult.customCropName,
    t7AreaRai: rawResult.areaRai,
    t7TreeCount: rawResult.treeCount,
    t7PlotObjective: rawResult.plotObjective || rawResult.objective,
    t7ExperimentDetail: rawResult.experimentDetail,
    t7MainCropInfo: rawResult.mainCropInfo,
    t7Irrigations: rawResult.irrigations || [],
    t7PlantingDate: rawResult.plantingDate,
    t7InitialSprayDate: rawResult.initialSprayDate,
    t7NextSprayDate: rawResult.nextSprayDate,
    t7NextFollowUpDate: rawResult.nextFollowUpDate,
    t7CropAgeValue: rawResult.cropAgeValue,
    t7CropAgeUnit: rawResult.cropAgeUnit,
    t7GrowthStage: rawResult.growthStage,
    t7CropCondition: rawResult.cropCondition,
    t7CropProblemDesc: rawResult.cropProblemDesc,
    t7ProductResponse: rawResult.productResponse,
    t7DemoProducts: rawResult.demoProducts || [],
    t7SprayMethod: rawResult.sprayMethod,
    t7SprayEquipment: rawResult.sprayEquipment,
    t7OtherEquipment: rawResult.otherEquipment,
    t7HasExternalChemicals: Boolean(rawResult.hasExternalChemicals),
    t7ExternalProducts: rawResult.externalProducts || [],
    t7InitialPhotos: rawResult.initialPhotos || [],
    t7PlotImages: rawResult.plotImages || [],
    t7CropImages: rawResult.cropImages || [],
    t7UsageMethod: rawResult.usageMethod,
    t7PlantingAreaCondition: rawResult.plantingAreaCondition,
    t7Notes: rawResult.notes,
    t7DemoPlotId: rawResult.demoPlotId,
    t7DemoResults: demoItems,
    t7PlotStatus: rawResult.plotStatus || "IN_PROGRESS",
    t7FinalYieldKg: rawResult.finalYieldKg,
    t7ControlYieldKg: rawResult.controlYieldKg,
    t7YieldIncreasePercent: rawResult.yieldIncreasePercent,
    t7FarmerSatisfaction: rawResult.farmerSatisfaction,
  };
}
