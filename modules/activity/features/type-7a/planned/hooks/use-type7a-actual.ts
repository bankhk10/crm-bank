"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type {
  Type7aActualRecord,
  Type7aPlannedProductActualItem,
  Type7aAdditionalProductItem,
  Type7aExternalChemicalItem,
} from "../types/actual.types";
import type { Type7aImageFile } from "../../shared/types";
import {
  uploadActivityPlanImageGroup,
  deleteActivityPlanImagePaths,
} from "@/modules/activity/application/media/image-uploader";

export function useType7aActual() {
  // 1. เกษตรกร & พิกัด
  const [t7SelectedProvince, setT7SelectedProvince] = useState("");
  const [t7FarmerProvince, setT7FarmerProvince] = useState("");
  const [t7FarmerDistrict, setT7FarmerDistrict] = useState("");
  const [t7FarmerSubdistrict, setT7FarmerSubdistrict] = useState("");
  const [t7FarmerCustomerId, setT7FarmerCustomerId] = useState<string | null>(null);
  const [t7FarmerName, setT7FarmerName] = useState("");
  const [t7FarmerPhone, setT7FarmerPhone] = useState("");
  const [t7IsUnregisteredFarmer, setT7IsUnregisteredFarmer] = useState(false);
  const [t7DealerName, setT7DealerName] = useState("");
  const [t7DealerCode, setT7DealerCode] = useState("");
  const [t7Latitude, setT7Latitude] = useState<number | string>("");
  const [t7Longitude, setT7Longitude] = useState<number | string>("");
  const [t7PlotName, setT7PlotName] = useState("");
  const [t7District, setT7District] = useState("");
  const [t7CropCategory, setT7CropCategory] = useState("");
  const [t7CropName, setT7CropName] = useState("");
  const [t7CustomCropName, setT7CustomCropName] = useState("");
  const [t7AreaRai, setT7AreaRai] = useState<number | string>("");
  const [t7TreeCount, setT7TreeCount] = useState<number | string>("");
  const [t7PlotObjective, setT7PlotObjective] = useState("");
  const [t7DemoPlotId, setT7DemoPlotId] = useState<string | null>(null);

  // 2. ข้อมูลสภาพแปลงเริ่มต้น (Initial Plot Condition)
  const [t7MainCropInfo, setT7MainCropInfo] = useState("");
  const [t7ExperimentDetail, setT7ExperimentDetail] = useState("");
  const [t7Irrigations, setT7Irrigations] = useState<string[]>([]);
  const [t7PlantingDate, setT7PlantingDate] = useState("");
  const [t7InitialSprayDate, setT7InitialSprayDate] = useState("");
  const [t7NextSprayDate, setT7NextSprayDate] = useState("");
  const [t7CropAgeValue, setT7CropAgeValue] = useState<number | string>("");
  const [t7CropAgeUnit, setT7CropAgeUnit] = useState<"วัน" | "เดือน" | string>("วัน");
  const [t7GrowthStage, setT7GrowthStage] = useState("");
  const [t7Notes, setT7Notes] = useState("");

  // 3. วิธีการฉีดพ่น & ยาภายนอก
  const [t7SprayMethod, setT7SprayMethod] = useState<"SINGLE" | "TANK_MIXED" | string>("SINGLE");
  const [t7HasExternalChemicals, setT7HasExternalChemicals] = useState(false);
  const [t7ExternalProducts, setT7ExternalProducts] = useState<Type7aExternalChemicalItem[]>([]);

  // 4. อุปกรณ์ที่ใช้ฉีดพ่น
  const [t7SprayEquipment, setT7SprayEquipment] = useState("เครื่องพ่นสะพายหลัง");
  const [t7OtherEquipment, setT7OtherEquipment] = useState("");

  // 5 & 6. สินค้าตามแผน และ สินค้าเพิ่มเติม
  const [t7PlannedProducts, setT7PlannedProducts] = useState<Type7aPlannedProductActualItem[]>([]);
  const [t7AdditionalProducts, setT7AdditionalProducts] = useState<Type7aAdditionalProductItem[]>([]);

  // 7. ภาพถ่ายแปลงสาธิต
  const [t7InitialPhotos, setT7InitialPhotos] = useState<Type7aImageFile[]>([]);
  const initialPhotosRef = useRef<Type7aImageFile[]>([]);

  // Backward-compat states
  const [t7CropCondition, setT7CropCondition] = useState("");
  const [t7ProductResponse, setT7ProductResponse] = useState("");

  // -------------------------------------------------------------
  // Helpers for Products & External Chemicals
  // -------------------------------------------------------------
  const updatePlannedProduct = useCallback(
    (index: number, field: keyof Type7aPlannedProductActualItem, value: any) => {
      setT7PlannedProducts((prev) => {
        const copy = [...prev];
        if (copy[index]) {
          copy[index] = { ...copy[index], [field]: value };
        }
        return copy;
      });
    },
    [],
  );

  const addAdditionalProduct = useCallback(
    (item?: Partial<Type7aAdditionalProductItem>) => {
      setT7AdditionalProducts((prev) => [
        ...prev,
        {
          id: `add-prod-${Date.now()}-${prev.length}`,
          productId: item?.productId || "",
          productName: item?.productName || "",
          actualQuantity: item?.actualQuantity ?? 1,
          extraQuantity: item?.extraQuantity ?? "",
          extraUnit: item?.extraUnit || "ซีซี",
          applicationRate: item?.applicationRate || "",
        },
      ]);
    },
    [],
  );

  const updateAdditionalProduct = useCallback(
    (index: number, field: keyof Type7aAdditionalProductItem, value: any) => {
      setT7AdditionalProducts((prev) => {
        const copy = [...prev];
        if (copy[index]) {
          copy[index] = { ...copy[index], [field]: value };
        }
        return copy;
      });
    },
    [],
  );

  const removeAdditionalProduct = useCallback((index: number) => {
    setT7AdditionalProducts((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const addExternalProduct = useCallback(
    (item?: Partial<Type7aExternalChemicalItem>) => {
      setT7ExternalProducts((prev) => [
        ...prev,
        {
          id: `ext-chem-${Date.now()}-${prev.length}`,
          company: item?.company || "",
          productName: item?.productName || "",
          activeIngredient: item?.activeIngredient || "",
          formula: item?.formula || "SL",
          customFormula: item?.customFormula || "",
          applicationRate: item?.applicationRate || "",
        },
      ]);
    },
    [],
  );

  const updateExternalProduct = useCallback(
    (index: number, field: keyof Type7aExternalChemicalItem, value: any) => {
      setT7ExternalProducts((prev) => {
        const copy = [...prev];
        if (copy[index]) {
          copy[index] = { ...copy[index], [field]: value };
        }
        return copy;
      });
    },
    [],
  );

  const removeExternalProduct = useCallback((index: number) => {
    setT7ExternalProducts((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  // -------------------------------------------------------------
  // Hydration from Plan and Parsed Actual Data
  // -------------------------------------------------------------
  const hydrate = useCallback((plan: any, parsed: any, extractedTargets?: any) => {
    const t7aTarget = extractedTargets?.t7a || extractedTargets?.t7 || plan?.type7aPlots?.[0];

    // Hydrate targets from Plan
    if (t7aTarget) {
      if (t7aTarget.plotName || t7aTarget.name) setT7PlotName(t7aTarget.plotName || t7aTarget.name);
      if (t7aTarget.farmerName || t7aTarget.ownerName) setT7FarmerName(t7aTarget.farmerName || t7aTarget.ownerName);
      if (t7aTarget.farmerCustomerId) setT7FarmerCustomerId(t7aTarget.farmerCustomerId);
      if (t7aTarget.cropName) setT7CropName(t7aTarget.cropName);
      if (t7aTarget.cropCategory) setT7CropCategory(t7aTarget.cropCategory);
      if (t7aTarget.province) {
        setT7FarmerProvince(t7aTarget.province);
        setT7SelectedProvince(t7aTarget.province);
      }
      if (t7aTarget.district) setT7FarmerDistrict(t7aTarget.district);
      if (t7aTarget.areaRai != null) setT7AreaRai(String(t7aTarget.areaRai));
      if (t7aTarget.treeCount != null) setT7TreeCount(String(t7aTarget.treeCount));
      if (t7aTarget.objective) setT7PlotObjective(t7aTarget.objective);
      if (t7aTarget.demoPlotId) setT7DemoPlotId(t7aTarget.demoPlotId);

      // Initialize planned products from plan target if not parsed yet
      const prods = t7aTarget.products || t7aTarget.demoProducts || [];
      if (Array.isArray(prods) && prods.length > 0) {
        setT7PlannedProducts(
          prods.map((p: any) => ({
            productId: p.productId || p.id || "",
            productName: p.productName || p.name || "",
            withdrawnQuantity: Number(p.quantity ?? p.targetQuantity ?? 1) || 1,
            actualQuantity: Number(p.quantity ?? p.targetQuantity ?? 1) || 1,
            extraQuantity: "",
            extraUnit: p.unit?.includes("ซอง") ? "กรัม" : "ซีซี",
            applicationRate: p.applicationRate || "",
          })),
        );
      }
    }

    // Hydrate previous actual record
    if (parsed) {
      if (parsed.t7PlotName) setT7PlotName(parsed.t7PlotName);
      if (parsed.t7FarmerName) setT7FarmerName(parsed.t7FarmerName);
      if (parsed.t7FarmerCustomerId) setT7FarmerCustomerId(parsed.t7FarmerCustomerId);
      if (parsed.t7FarmerPhone) setT7FarmerPhone(parsed.t7FarmerPhone);
      if (parsed.t7FarmerProvince) {
        setT7FarmerProvince(parsed.t7FarmerProvince);
        setT7SelectedProvince(parsed.t7FarmerProvince);
      }
      if (parsed.t7FarmerDistrict) setT7FarmerDistrict(parsed.t7FarmerDistrict);
      if (parsed.t7FarmerSubdistrict) setT7FarmerSubdistrict(parsed.t7FarmerSubdistrict);
      if (parsed.t7IsUnregisteredFarmer != null) setT7IsUnregisteredFarmer(Boolean(parsed.t7IsUnregisteredFarmer));

      if (parsed.t7Latitude != null) setT7Latitude(parsed.t7Latitude);
      if (parsed.t7Longitude != null) setT7Longitude(parsed.t7Longitude);
      if (parsed.t7MainCropInfo) setT7MainCropInfo(parsed.t7MainCropInfo);
      if (parsed.t7ExperimentDetail) setT7ExperimentDetail(parsed.t7ExperimentDetail);
      if (Array.isArray(parsed.t7Irrigations)) setT7Irrigations(parsed.t7Irrigations);

      if (parsed.t7PlantingDate) setT7PlantingDate(parsed.t7PlantingDate);
      if (parsed.t7InitialSprayDate) setT7InitialSprayDate(parsed.t7InitialSprayDate);
      if (parsed.t7NextSprayDate) setT7NextSprayDate(parsed.t7NextSprayDate);
      if (parsed.t7CropAgeValue != null) setT7CropAgeValue(parsed.t7CropAgeValue);
      if (parsed.t7CropAgeUnit) setT7CropAgeUnit(parsed.t7CropAgeUnit);
      if (parsed.t7GrowthStage) setT7GrowthStage(parsed.t7GrowthStage);
      if (parsed.t7Notes) setT7Notes(parsed.t7Notes);

      if (parsed.t7SprayMethod) setT7SprayMethod(parsed.t7SprayMethod);
      if (parsed.t7HasExternalChemicals != null) setT7HasExternalChemicals(Boolean(parsed.t7HasExternalChemicals));
      if (Array.isArray(parsed.t7ExternalProducts)) setT7ExternalProducts(parsed.t7ExternalProducts);

      if (parsed.t7SprayEquipment) setT7SprayEquipment(parsed.t7SprayEquipment);
      if (parsed.t7OtherEquipment) setT7OtherEquipment(parsed.t7OtherEquipment);

      if (Array.isArray(parsed.t7PlannedProducts) && parsed.t7PlannedProducts.length > 0) {
        setT7PlannedProducts(parsed.t7PlannedProducts);
      }
      if (Array.isArray(parsed.t7AdditionalProducts)) {
        setT7AdditionalProducts(parsed.t7AdditionalProducts);
      }

      if (parsed.t7InitialPhotos) {
        setT7InitialPhotos(parsed.t7InitialPhotos);
        initialPhotosRef.current = parsed.t7InitialPhotos;
      }
    }
  }, []);

  // -------------------------------------------------------------
  // Build Payload for Submission
  // -------------------------------------------------------------
  const buildPayload = useCallback(() => {
    return {
      t7SelectedProvince,
      t7FarmerProvince,
      t7FarmerDistrict,
      t7FarmerSubdistrict,
      t7FarmerCustomerId,
      t7FarmerName,
      t7FarmerPhone,
      t7IsUnregisteredFarmer,
      t7DealerName,
      t7DealerCode,
      t7Latitude: t7Latitude !== "" && !isNaN(Number(t7Latitude)) ? Number(t7Latitude) : undefined,
      t7Longitude: t7Longitude !== "" && !isNaN(Number(t7Longitude)) ? Number(t7Longitude) : undefined,
      t7PlotName,
      t7District,
      t7CropCategory,
      t7CropName,
      t7CustomCropName,
      t7AreaRai: t7AreaRai !== "" && !isNaN(Number(t7AreaRai)) ? Number(t7AreaRai) : null,
      t7TreeCount: t7TreeCount !== "" && !isNaN(Number(t7TreeCount)) ? Number(t7TreeCount) : null,
      t7PlotObjective,
      t7DemoPlotId,

      // Initial Plot Condition
      t7MainCropInfo,
      t7ExperimentDetail,
      t7Irrigations,
      t7PlantingDate,
      t7InitialSprayDate,
      t7NextSprayDate,
      t7CropAgeValue: t7CropAgeValue !== "" && !isNaN(Number(t7CropAgeValue)) ? Number(t7CropAgeValue) : null,
      t7CropAgeUnit,
      t7GrowthStage,
      t7Notes,

      // Spraying
      t7SprayMethod,
      t7HasExternalChemicals,
      t7ExternalProducts,
      t7SprayEquipment,
      t7OtherEquipment,

      // Products
      t7PlannedProducts,
      t7AdditionalProducts,

      // Photos
      t7InitialPhotos,
      demoPlotId: t7DemoPlotId,
    };
  }, [
    t7SelectedProvince,
    t7FarmerProvince,
    t7FarmerDistrict,
    t7FarmerSubdistrict,
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
    t7DemoPlotId,
    t7MainCropInfo,
    t7ExperimentDetail,
    t7Irrigations,
    t7PlantingDate,
    t7InitialSprayDate,
    t7NextSprayDate,
    t7CropAgeValue,
    t7CropAgeUnit,
    t7GrowthStage,
    t7Notes,
    t7SprayMethod,
    t7HasExternalChemicals,
    t7ExternalProducts,
    t7SprayEquipment,
    t7OtherEquipment,
    t7PlannedProducts,
    t7AdditionalProducts,
    t7InitialPhotos,
  ]);

  // -------------------------------------------------------------
  // Computed Demo Products (Combined for generic queries/views)
  // -------------------------------------------------------------
  const t7DemoProducts = useMemo(() => {
    return [
      ...t7PlannedProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        quantity: p.actualQuantity,
        extraQuantity: p.extraQuantity,
        extraUnit: p.extraUnit,
        applicationRate: p.applicationRate,
        isAdditional: false,
      })),
      ...t7AdditionalProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        quantity: p.actualQuantity,
        extraQuantity: p.extraQuantity,
        extraUnit: p.extraUnit,
        applicationRate: p.applicationRate,
        isAdditional: true,
      })),
    ];
  }, [t7PlannedProducts, t7AdditionalProducts]);

  // -------------------------------------------------------------
  // Image Uploading to Storage
  // -------------------------------------------------------------
  const uploadImages = useCallback(
    async (planId: string, _newlyUploadedUrls?: string[]) => {
      const result = await uploadActivityPlanImageGroup(
        planId,
        t7InitialPhotos,
        "PLOT",
      );
      setT7InitialPhotos(result.updatedImages);
      initialPhotosRef.current = result.updatedImages;
      return result;
    },
    [t7InitialPhotos],
  );

  const cleanupImages = useCallback(
    async (planId?: string) => {
      const urls = t7InitialPhotos.map((img) => img.url).filter(Boolean);
      if (urls.length > 0) {
        await deleteActivityPlanImagePaths(planId || "general", urls);
      }
    },
    [t7InitialPhotos],
  );

  const handleUpdateField = useCallback(
    (field: keyof Type7aActualRecord, value: any) => {
      switch (field) {
        case "t7SelectedProvince": setT7SelectedProvince(value); break;
        case "t7FarmerProvince": setT7FarmerProvince(value); break;
        case "t7FarmerDistrict": setT7FarmerDistrict(value); break;
        case "t7FarmerSubdistrict": setT7FarmerSubdistrict(value); break;
        case "t7FarmerCustomerId": setT7FarmerCustomerId(value); break;
        case "t7FarmerName": setT7FarmerName(value); break;
        case "t7FarmerPhone": setT7FarmerPhone(value); break;
        case "t7IsUnregisteredFarmer": setT7IsUnregisteredFarmer(Boolean(value)); break;
        case "t7PlotName": setT7PlotName(value); break;
        case "t7Latitude": setT7Latitude(value); break;
        case "t7Longitude": setT7Longitude(value); break;
        case "t7MainCropInfo": setT7MainCropInfo(value); break;
        case "t7ExperimentDetail": setT7ExperimentDetail(value); break;
        case "t7Irrigations": setT7Irrigations(value); break;
        case "t7PlantingDate": setT7PlantingDate(value); break;
        case "t7InitialSprayDate": setT7InitialSprayDate(value); break;
        case "t7NextSprayDate": setT7NextSprayDate(value); break;
        case "t7CropAgeValue": setT7CropAgeValue(value); break;
        case "t7CropAgeUnit": setT7CropAgeUnit(value); break;
        case "t7GrowthStage": setT7GrowthStage(value); break;
        case "t7Notes": setT7Notes(value); break;
        case "t7SprayMethod": setT7SprayMethod(value); break;
        case "t7HasExternalChemicals": setT7HasExternalChemicals(Boolean(value)); break;
        case "t7ExternalProducts": setT7ExternalProducts(value); break;
        case "t7SprayEquipment": setT7SprayEquipment(value); break;
        case "t7OtherEquipment": setT7OtherEquipment(value); break;
        case "t7PlannedProducts": setT7PlannedProducts(value); break;
        case "t7AdditionalProducts": setT7AdditionalProducts(value); break;
        case "t7InitialPhotos": setT7InitialPhotos(value); break;
        case "t7CropCategory": setT7CropCategory(value); break;
        case "t7CropName": setT7CropName(value); break;
        case "t7AreaRai": setT7AreaRai(value); break;
        case "t7TreeCount": setT7TreeCount(value); break;
        case "t7PlotObjective": setT7PlotObjective(value); break;
        default: break;
      }
    },
    [],
  );

  return {
    // States
    t7SelectedProvince,
    setT7SelectedProvince,
    t7FarmerProvince,
    setT7FarmerProvince,
    t7FarmerDistrict,
    setT7FarmerDistrict,
    t7FarmerSubdistrict,
    setT7FarmerSubdistrict,
    t7FarmerCustomerId,
    setT7FarmerCustomerId,
    t7FarmerName,
    setT7FarmerName,
    t7FarmerPhone,
    setT7FarmerPhone,
    t7IsUnregisteredFarmer,
    setT7IsUnregisteredFarmer,
    t7Latitude,
    setT7Latitude,
    t7Longitude,
    setT7Longitude,
    t7PlotName,
    setT7PlotName,
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
    t7MainCropInfo,
    setT7MainCropInfo,
    t7ExperimentDetail,
    setT7ExperimentDetail,
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
    t7Notes,
    setT7Notes,
    t7SprayMethod,
    setT7SprayMethod,
    t7HasExternalChemicals,
    setT7HasExternalChemicals,
    t7ExternalProducts,
    setT7ExternalProducts,
    t7SprayEquipment,
    setT7SprayEquipment,
    t7OtherEquipment,
    setT7OtherEquipment,
    t7PlannedProducts,
    setT7PlannedProducts,
    t7AdditionalProducts,
    setT7AdditionalProducts,
    t7DemoProducts,
    t7InitialPhotos,
    setT7InitialPhotos,
    t7DemoPlotId,
    setT7DemoPlotId,

    // Aggregated state
    actualState: {
      t7SelectedProvince,
      t7FarmerProvince,
      t7FarmerDistrict,
      t7FarmerSubdistrict,
      t7FarmerCustomerId,
      t7FarmerName,
      t7FarmerPhone,
      t7IsUnregisteredFarmer,
      t7DealerName,
      t7DealerCode,
      t7Latitude: t7Latitude !== "" && !isNaN(Number(t7Latitude)) ? Number(t7Latitude) : undefined,
      t7Longitude: t7Longitude !== "" && !isNaN(Number(t7Longitude)) ? Number(t7Longitude) : undefined,
      t7PlotName,
      t7District,
      t7CropCategory,
      t7CropName,
      t7CustomCropName,
      t7AreaRai: t7AreaRai !== "" && !isNaN(Number(t7AreaRai)) ? Number(t7AreaRai) : null,
      t7TreeCount: t7TreeCount !== "" && !isNaN(Number(t7TreeCount)) ? Number(t7TreeCount) : null,
      t7PlotObjective,
      t7MainCropInfo,
      t7ExperimentDetail,
      t7Irrigations,
      t7PlantingDate,
      t7InitialSprayDate,
      t7NextSprayDate,
      t7CropAgeValue,
      t7CropAgeUnit,
      t7GrowthStage,
      t7Notes,
      t7SprayMethod,
      t7HasExternalChemicals,
      t7ExternalProducts,
      t7SprayEquipment,
      t7OtherEquipment,
      t7PlannedProducts,
      t7AdditionalProducts,
      t7InitialPhotos,
      t7DemoPlotId,
      t7CropCondition,
      t7ProductResponse,
    },

    // Handlers
    handleUpdateField,
    updatePlannedProduct,
    addAdditionalProduct,
    updateAdditionalProduct,
    removeAdditionalProduct,
    addExternalProduct,
    updateExternalProduct,
    removeExternalProduct,
    hydrate,
    buildPayload,
    uploadImages,
    cleanupImages,
  };
}
