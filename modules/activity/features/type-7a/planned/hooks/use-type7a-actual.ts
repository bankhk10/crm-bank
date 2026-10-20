"use client";

import { useState, useRef, useCallback } from "react";
import type { Type7aActualRecord } from "../types/actual.types";
import type { Type7aImageFile } from "../../shared/types";
import {
  uploadActivityPlanImageGroup,
  deleteActivityPlanImagePaths,
} from "@/modules/activity/application/media/image-uploader";

export function useType7aActual() {
  const [t7FarmerProvince, setT7FarmerProvince] = useState("");
  const [t7FarmerDistrict, setT7FarmerDistrict] = useState("");
  const [t7FarmerCustomerId, setT7FarmerCustomerId] = useState<string | null>(null);
  const [t7FarmerName, setT7FarmerName] = useState("");
  const [t7FarmerPhone, setT7FarmerPhone] = useState("");
  const [t7IsUnregisteredFarmer, setT7IsUnregisteredFarmer] = useState(false);
  const [t7DealerName, setT7DealerName] = useState("");
  const [t7DealerCode, setT7DealerCode] = useState("");
  const [t7Latitude, setT7Latitude] = useState("");
  const [t7Longitude, setT7Longitude] = useState("");
  const [t7PlotName, setT7PlotName] = useState("");
  const [t7District, setT7District] = useState("");
  const [t7CropCategory, setT7CropCategory] = useState("");
  const [t7CropName, setT7CropName] = useState("");
  const [t7CustomCropName, setT7CustomCropName] = useState("");
  const [t7AreaRai, setT7AreaRai] = useState("");
  const [t7TreeCount, setT7TreeCount] = useState("");
  const [t7PlotObjective, setT7PlotObjective] = useState("");
  const [t7ExperimentDetail, setT7ExperimentDetail] = useState("");
  const [t7MainCropInfo, setT7MainCropInfo] = useState("");
  const [t7Irrigations, setT7Irrigations] = useState<string[]>([]);
  const [t7PlantingDate, setT7PlantingDate] = useState("");
  const [t7InitialSprayDate, setT7InitialSprayDate] = useState("");
  const [t7NextSprayDate, setT7NextSprayDate] = useState("");
  const [t7CropAgeValue, setT7CropAgeValue] = useState("");
  const [t7CropAgeUnit, setT7CropAgeUnit] = useState("วัน");
  const [t7GrowthStage, setT7GrowthStage] = useState("");
  const [t7CropCondition, setT7CropCondition] = useState<
    "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | ""
  >("");
  const [t7ProductResponse, setT7ProductResponse] = useState<
    "พืชตอบสนองดี" | "พบปัญหา" | ""
  >("");
  const [t7DemoProducts, setT7DemoProducts] = useState<any[]>([]);
  const [t7SprayMethod, setT7SprayMethod] = useState<"SINGLE" | "TANK_MIXED">("SINGLE");
  const [t7SprayEquipment, setT7SprayEquipment] = useState<string>("เป้สะพายหลัง");
  const [t7OtherEquipment, setT7OtherEquipment] = useState<string>("");
  const [t7HasExternalChemicals, setT7HasExternalChemicals] = useState(false);
  const [t7ExternalProducts, setT7ExternalProducts] = useState<any[]>([]);
  const [t7InitialPhotos, setT7InitialPhotos] = useState<Type7aImageFile[]>([]);
  const initialPhotosRef = useRef<Type7aImageFile[]>([]);
  const [t7DemoPlotId, setT7DemoPlotId] = useState<string | null>(null);

  const hydrate = useCallback((plan: any, parsed: any, extractedTargets?: any) => {
    const t7aTarget = extractedTargets?.t7a || extractedTargets?.t7 || plan?.type7aPlots?.[0];

    if (t7aTarget) {
      if (t7aTarget.plotName || t7aTarget.name) setT7PlotName(t7aTarget.plotName || t7aTarget.name);
      if (t7aTarget.farmerName || t7aTarget.ownerName) setT7FarmerName(t7aTarget.farmerName || t7aTarget.ownerName);
      if (t7aTarget.cropName) setT7CropName(t7aTarget.cropName);
      if (t7aTarget.cropCategory) setT7CropCategory(t7aTarget.cropCategory);
      if (t7aTarget.province) setT7FarmerProvince(t7aTarget.province);
      if (t7aTarget.district) setT7FarmerDistrict(t7aTarget.district);
      if (t7aTarget.areaRai != null) setT7AreaRai(String(t7aTarget.areaRai));
      if (t7aTarget.treeCount != null) setT7TreeCount(String(t7aTarget.treeCount));
      if (t7aTarget.objective) setT7PlotObjective(t7aTarget.objective);
      if (t7aTarget.demoPlotId) setT7DemoPlotId(t7aTarget.demoPlotId);
    }

    if (parsed) {
      if (parsed.t7PlotName) setT7PlotName(parsed.t7PlotName);
      if (parsed.t7FarmerName) setT7FarmerName(parsed.t7FarmerName);
      if (parsed.t7FarmerPhone) setT7FarmerPhone(parsed.t7FarmerPhone);
      if (parsed.t7CropName) setT7CropName(parsed.t7CropName);
      if (parsed.t7CropCategory) setT7CropCategory(parsed.t7CropCategory);
      if (parsed.t7AreaRai != null) setT7AreaRai(String(parsed.t7AreaRai));
      if (parsed.t7PlotObjective) setT7PlotObjective(parsed.t7PlotObjective);
      if (parsed.t7GrowthStage) setT7GrowthStage(parsed.t7GrowthStage);
      if (parsed.t7CropCondition) setT7CropCondition(parsed.t7CropCondition);
      if (parsed.t7InitialPhotos) {
        setT7InitialPhotos(parsed.t7InitialPhotos);
        initialPhotosRef.current = parsed.t7InitialPhotos;
      }
    }
  }, []);

  const buildPayload = useCallback(() => {
    return {
      t7FarmerProvince,
      t7FarmerDistrict,
      t7FarmerCustomerId,
      t7FarmerName,
      t7FarmerPhone,
      t7IsUnregisteredFarmer,
      t7DealerName,
      t7DealerCode,
      t7Latitude: t7Latitude ? Number(t7Latitude) : undefined,
      t7Longitude: t7Longitude ? Number(t7Longitude) : undefined,
      t7PlotName,
      t7District,
      t7CropCategory,
      t7CropName,
      t7CustomCropName,
      t7AreaRai: t7AreaRai ? Number(t7AreaRai) : null,
      t7TreeCount: t7TreeCount ? Number(t7TreeCount) : null,
      t7PlotObjective,
      t7ExperimentDetail,
      t7MainCropInfo,
      t7Irrigations,
      t7PlantingDate,
      t7InitialSprayDate,
      t7NextSprayDate,
      t7CropAgeValue,
      t7CropAgeUnit,
      t7GrowthStage,
      t7CropCondition,
      t7ProductResponse,
      t7DemoProducts,
      t7SprayMethod,
      t7SprayEquipment,
      t7OtherEquipment,
      t7HasExternalChemicals,
      t7ExternalProducts,
      t7InitialPhotos,
      t7DemoPlotId,
    };
  }, [
    t7FarmerProvince,
    t7FarmerDistrict,
    t7FarmerCustomerId,
    t7FarmerName,
    t7FarmerPhone,
    t7IsUnregisteredFarmer,
    t7DealerName,
    t7DealerCode,
    t7Latitude,
    t7Longitude,
    t7PlotName,
    t7District,
    t7CropCategory,
    t7CropName,
    t7CustomCropName,
    t7AreaRai,
    t7TreeCount,
    t7PlotObjective,
    t7ExperimentDetail,
    t7MainCropInfo,
    t7Irrigations,
    t7PlantingDate,
    t7InitialSprayDate,
    t7NextSprayDate,
    t7CropAgeValue,
    t7CropAgeUnit,
    t7GrowthStage,
    t7CropCondition,
    t7ProductResponse,
    t7DemoProducts,
    t7SprayMethod,
    t7SprayEquipment,
    t7OtherEquipment,
    t7HasExternalChemicals,
    t7ExternalProducts,
    t7InitialPhotos,
    t7DemoPlotId,
  ]);

  return {
    t7FarmerProvince,
    setT7FarmerProvince,
    t7FarmerDistrict,
    setT7FarmerDistrict,
    t7FarmerCustomerId,
    setT7FarmerCustomerId,
    t7FarmerName,
    setT7FarmerName,
    t7FarmerPhone,
    setT7FarmerPhone,
    t7IsUnregisteredFarmer,
    setT7IsUnregisteredFarmer,
    t7DealerName,
    setT7DealerName,
    t7DealerCode,
    setT7DealerCode,
    t7Latitude,
    setT7Latitude,
    t7Longitude,
    setT7Longitude,
    t7PlotName,
    setT7PlotName,
    t7District,
    setT7District,
    t7CropCategory,
    setT7CropCategory,
    t7CropName,
    setT7CropName,
    t7CustomCropName,
    setT7CustomCropName,
    t7AreaRai,
    setT7AreaRai,
    t7TreeCount,
    setT7TreeCount,
    t7PlotObjective,
    setT7PlotObjective,
    t7ExperimentDetail,
    setT7ExperimentDetail,
    t7MainCropInfo,
    setT7MainCropInfo,
    t7Irrigations,
    setT7Irrigations,
    t7PlantingDate,
    setT7PlantingDate,
    t7InitialSprayDate,
    setT7InitialSprayDate,
    t7NextSprayDate,
    setT7NextSprayDate,
    t7CropAgeValue,
    setT7CropAgeValue,
    t7CropAgeUnit,
    setT7CropAgeUnit,
    t7GrowthStage,
    setT7GrowthStage,
    t7CropCondition,
    setT7CropCondition,
    t7ProductResponse,
    setT7ProductResponse,
    t7DemoProducts,
    setT7DemoProducts,
    t7SprayMethod,
    setT7SprayMethod,
    t7SprayEquipment,
    setT7SprayEquipment,
    t7OtherEquipment,
    setT7OtherEquipment,
    t7HasExternalChemicals,
    setT7HasExternalChemicals,
    t7ExternalProducts,
    setT7ExternalProducts,
    t7InitialPhotos,
    setT7InitialPhotos,
    t7DemoPlotId,
    setT7DemoPlotId,
    actualState: {
      t7FarmerProvince,
      t7FarmerDistrict,
      t7FarmerCustomerId,
      t7FarmerName,
      t7FarmerPhone,
      t7IsUnregisteredFarmer,
      t7DealerName,
      t7DealerCode,
      t7Latitude: t7Latitude ? Number(t7Latitude) : undefined,
      t7Longitude: t7Longitude ? Number(t7Longitude) : undefined,
      t7PlotName,
      t7District,
      t7CropCategory,
      t7CropName,
      t7CustomCropName,
      t7AreaRai: t7AreaRai ? Number(t7AreaRai) : null,
      t7TreeCount: t7TreeCount ? Number(t7TreeCount) : null,
      t7PlotObjective,
      t7ExperimentDetail,
      t7MainCropInfo,
      t7Irrigations,
      t7PlantingDate,
      t7InitialSprayDate,
      t7NextSprayDate,
      t7CropAgeValue,
      t7CropAgeUnit,
      t7GrowthStage,
      t7CropCondition,
      t7ProductResponse,
      t7DemoProducts,
      t7SprayMethod,
      t7SprayEquipment,
      t7OtherEquipment,
      t7HasExternalChemicals,
      t7ExternalProducts,
      t7InitialPhotos,
      t7DemoPlotId,
    },
    handleUpdateField: (field: keyof Type7aActualRecord, value: any) => {
      switch (field) {
        case "t7PlotName": setT7PlotName(value); break;
        case "t7FarmerName": setT7FarmerName(value); break;
        case "t7FarmerPhone": setT7FarmerPhone(value); break;
        case "t7CropCategory": setT7CropCategory(value); break;
        case "t7CropName": setT7CropName(value); break;
        case "t7CustomCropName": setT7CustomCropName(value); break;
        case "t7AreaRai": setT7AreaRai(value); break;
        case "t7TreeCount": setT7TreeCount(value); break;
        case "t7PlotObjective": setT7PlotObjective(value); break;
        case "t7Latitude": setT7Latitude(value); break;
        case "t7Longitude": setT7Longitude(value); break;
        case "t7InitialPhotos": setT7InitialPhotos(value); break;
        case "t7DemoProducts": setT7DemoProducts(value); break;
        case "t7ExperimentDetail": setT7ExperimentDetail(value); break;
        case "t7GrowthStage": setT7GrowthStage(value); break;
        case "t7CropCondition": setT7CropCondition(value); break;
        case "t7ProductResponse": setT7ProductResponse(value); break;
        case "t7SprayMethod": setT7SprayMethod(value); break;
        case "t7SprayEquipment": setT7SprayEquipment(value); break;
        case "t7PlantingDate": setT7PlantingDate(value); break;
        case "t7InitialSprayDate": setT7InitialSprayDate(value); break;
        case "t7NextSprayDate": setT7NextSprayDate(value); break;
        case "t7Irrigations": setT7Irrigations(value); break;
        case "t7FarmerProvince": setT7FarmerProvince(value); break;
        case "t7FarmerDistrict": setT7FarmerDistrict(value); break;
        case "t7FarmerCustomerId": setT7FarmerCustomerId(value); break;
        default: break;
      }
    },
    hydrate,
    buildPayload,
  };
}
