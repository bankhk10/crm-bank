"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type {
  Type7aActualRecord,
  Type7aPlannedProductActualItem,
  Type7aAdditionalProductItem,
  Type7aExternalChemicalItem,
} from "../types/actual.types";
import type { Type7aImageFile } from "../../shared/types";
import { parseType7aActualResult } from "../application/actual-mapper";
import { formatPhoneNumber } from "../../shared/utils";
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
  const [t7SprayEquipment, setT7SprayEquipment] = useState("เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)");
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
    // 1. Resolve Dedicated ActivityResultType7a record from all possible locations
    const dedicated7a =
      parsed?.type7aResults?.[0] ||
      plan?.type7aResults?.[0] ||
      extractedTargets?.t7a?.results?.[0] ||
      extractedTargets?.t7?.results?.[0] ||
      plan?.type7aTargets?.[0]?.results?.[0] ||
      plan?.activityPlan?.type7aResults?.[0] ||
      (parsed && (parsed.farmerName !== undefined || parsed.plantingDate !== undefined || parsed.sprayEquipment !== undefined)
        ? parsed
        : null);

    // 2. Self-healing: if parsed is not already structured with t7* keys, parse it
    const actualData: any =
      parsed?.t7FarmerName !== undefined || parsed?.t7PlannedProducts !== undefined
        ? parsed
        : parseType7aActualResult({
            ...parsed,
            type7aResults: plan?.type7aResults || parsed?.type7aResults,
            type7aPlots: plan?.type7aPlots || parsed?.type7aPlots,
            type7aTargets: plan?.type7aTargets || parsed?.type7aTargets,
            demoPlot: plan?.demoPlot || parsed?.demoPlot,
            activityPlan: plan,
          });

    const firstPlot = plan?.type7aTargets?.[0] || plan?.type7aPlots?.[0];
    const t7aTarget = extractedTargets?.t7a || extractedTargets?.t7 || firstPlot;
    const demoPlot =
      t7aTarget?.demoPlot ||
      firstPlot?.demoPlot ||
      (t7aTarget && (t7aTarget.id || t7aTarget.code) ? t7aTarget : null) ||
      (firstPlot && (firstPlot.id || firstPlot.code) ? firstPlot : null) ||
      plan?.demoPlot ||
      actualData?.demoPlot ||
      null;
    const visit1 = demoPlot?.visits?.[0] || null;

    // Helper for ISO date string YYYY-MM-DD
    const toDateString = (d: any): string => {
      if (!d) return "";
      if (typeof d === "string") {
        const match = d.match(/^\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
        const parsedD = new Date(d);
        return !isNaN(parsedD.getTime()) ? parsedD.toISOString().slice(0, 10) : "";
      }
      if (d instanceof Date && !isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
      return "";
    };

    // 1. Farmer Owner & Coordinates
    const resolvedProvince =
      actualData?.t7FarmerProvince ||
      actualData?.t7SelectedProvince ||
      dedicated7a?.province ||
      demoPlot?.ownerProvince ||
      demoPlot?.farmerCustomer?.province ||
      demoPlot?.province ||
      demoPlot?.customer?.province ||
      t7aTarget?.province ||
      plan?.province ||
      "";
    if (resolvedProvince) {
      setT7FarmerProvince(resolvedProvince);
      setT7SelectedProvince(resolvedProvince);
    }

    const resolvedDistrict =
      actualData?.t7FarmerDistrict ||
      dedicated7a?.district ||
      demoPlot?.ownerDistrict ||
      demoPlot?.farmerCustomer?.district ||
      demoPlot?.district ||
      demoPlot?.customer?.district ||
      t7aTarget?.district ||
      "";
    if (resolvedDistrict) setT7FarmerDistrict(resolvedDistrict);

    const resolvedSubdistrict =
      actualData?.t7FarmerSubdistrict ||
      dedicated7a?.subdistrict ||
      demoPlot?.ownerSubdistrict ||
      demoPlot?.farmerCustomer?.subdistrict ||
      "";
    if (resolvedSubdistrict) setT7FarmerSubdistrict(resolvedSubdistrict);

    const resolvedFarmerCustomerId =
      actualData?.t7FarmerCustomerId ||
      dedicated7a?.farmerCustomerId ||
      demoPlot?.farmerCustomerId ||
      t7aTarget?.farmerCustomerId ||
      null;
    if (resolvedFarmerCustomerId) setT7FarmerCustomerId(resolvedFarmerCustomerId);

    const resolvedFarmerName =
      actualData?.t7FarmerName ||
      dedicated7a?.farmerName ||
      demoPlot?.ownerName ||
      demoPlot?.farmerCustomer?.name ||
      t7aTarget?.farmerName ||
      t7aTarget?.ownerName ||
      "";
    if (resolvedFarmerName) setT7FarmerName(resolvedFarmerName);

    const resolvedFarmerPhone =
      actualData?.t7FarmerPhone ||
      dedicated7a?.farmerPhone ||
      demoPlot?.ownerPhone ||
      demoPlot?.farmerCustomer?.phone ||
      t7aTarget?.farmerPhone ||
      "";
    if (resolvedFarmerPhone) setT7FarmerPhone(formatPhoneNumber(resolvedFarmerPhone));

    const resolvedDealer =
      demoPlot?.customer ||
      t7aTarget?.customer ||
      t7aTarget?.store ||
      null;
    if (actualData?.t7DealerName) {
      setT7DealerName(actualData.t7DealerName);
      if (actualData.t7DealerCode) setT7DealerCode(actualData.t7DealerCode);
    } else if (resolvedDealer) {
      if (resolvedDealer.name) setT7DealerName(resolvedDealer.name);
      if (resolvedDealer.customerCode) setT7DealerCode(resolvedDealer.customerCode);
    }

    const resolvedIsUnregistered =
      actualData?.t7IsUnregisteredFarmer != null
        ? actualData.t7IsUnregisteredFarmer
        : dedicated7a?.isUnregisteredFarmer != null
        ? dedicated7a.isUnregisteredFarmer
        : demoPlot?.isUnregisteredFarmer != null
        ? demoPlot.isUnregisteredFarmer
        : false;
    setT7IsUnregisteredFarmer(Boolean(resolvedIsUnregistered));

    const resolvedLat =
      actualData?.t7Latitude != null && actualData.t7Latitude !== ""
        ? String(actualData.t7Latitude)
        : dedicated7a?.latitude != null
        ? String(dedicated7a.latitude)
        : demoPlot?.latitude != null
        ? String(demoPlot.latitude)
        : t7aTarget?.latitude != null
        ? String(t7aTarget.latitude)
        : "";
    if (resolvedLat) setT7Latitude(resolvedLat);

    const resolvedLng =
      actualData?.t7Longitude != null && actualData.t7Longitude !== ""
        ? String(actualData.t7Longitude)
        : dedicated7a?.longitude != null
        ? String(dedicated7a.longitude)
        : demoPlot?.longitude != null
        ? String(demoPlot.longitude)
        : t7aTarget?.longitude != null
        ? String(t7aTarget.longitude)
        : "";
    if (resolvedLng) setT7Longitude(resolvedLng);

    const resolvedPlotName =
      actualData?.t7PlotName ||
      demoPlot?.name ||
      t7aTarget?.plotName ||
      t7aTarget?.name ||
      "";
    if (resolvedPlotName) setT7PlotName(resolvedPlotName);

    const resolvedCropCategory =
      actualData?.t7CropCategory ||
      demoPlot?.cropCategory ||
      t7aTarget?.cropCategory ||
      "";
    if (resolvedCropCategory) setT7CropCategory(resolvedCropCategory);

    const resolvedCropName =
      actualData?.t7CropName ||
      demoPlot?.cropName ||
      t7aTarget?.cropName ||
      "";
    if (resolvedCropName) setT7CropName(resolvedCropName);

    const resolvedCustomCropName =
      actualData?.t7CustomCropName ||
      demoPlot?.customCropName ||
      t7aTarget?.customCropName ||
      "";
    if (resolvedCustomCropName) setT7CustomCropName(resolvedCustomCropName);

    const resolvedAreaRai =
      actualData?.t7AreaRai != null && actualData.t7AreaRai !== ""
        ? String(actualData.t7AreaRai)
        : demoPlot?.areaRai != null
        ? String(demoPlot.areaRai)
        : t7aTarget?.areaRai != null
        ? String(t7aTarget.areaRai)
        : "";
    if (resolvedAreaRai) setT7AreaRai(resolvedAreaRai);

    const resolvedTreeCount =
      actualData?.t7TreeCount != null && actualData.t7TreeCount !== ""
        ? String(actualData.t7TreeCount)
        : demoPlot?.treeCount != null
        ? String(demoPlot.treeCount)
        : t7aTarget?.treeCount != null
        ? String(t7aTarget.treeCount)
        : "";
    if (resolvedTreeCount) setT7TreeCount(resolvedTreeCount);

    const resolvedObjective =
      actualData?.t7PlotObjective ||
      demoPlot?.objective ||
      t7aTarget?.objective ||
      "";
    if (resolvedObjective) setT7PlotObjective(resolvedObjective);

    const resolvedDemoPlotId =
      actualData?.t7DemoPlotId ||
      dedicated7a?.demoPlotId ||
      demoPlot?.id ||
      t7aTarget?.demoPlotId ||
      null;
    if (resolvedDemoPlotId) setT7DemoPlotId(resolvedDemoPlotId);

    // 2. Initial Plot Condition & Observations
    const resolvedMainCropInfo =
      actualData?.t7MainCropInfo ||
      dedicated7a?.mainCropInfo ||
      demoPlot?.mainCropInfo ||
      "";
    if (resolvedMainCropInfo) setT7MainCropInfo(resolvedMainCropInfo);

    const resolvedExperimentDetail =
      actualData?.t7ExperimentDetail ||
      dedicated7a?.experimentDetail ||
      demoPlot?.experimentDetail ||
      "";
    if (resolvedExperimentDetail) setT7ExperimentDetail(resolvedExperimentDetail);

    // Irrigations
    if (Array.isArray(actualData?.t7Irrigations) && actualData.t7Irrigations.length > 0) {
      setT7Irrigations(actualData.t7Irrigations);
    } else if (Array.isArray(dedicated7a?.irrigations) && dedicated7a.irrigations.length > 0) {
      setT7Irrigations(
        dedicated7a.irrigations.map((i: any) => (typeof i === "string" ? i : i.method)).filter(Boolean),
      );
    } else if (demoPlot?.irrigations && Array.isArray(demoPlot.irrigations) && demoPlot.irrigations.length > 0) {
      setT7Irrigations(demoPlot.irrigations.map((i: any) => i.method).filter(Boolean));
    }

    // Dates
    const resolvedPlantingDate = toDateString(
      actualData?.t7PlantingDate ||
        dedicated7a?.plantingDate ||
        demoPlot?.plantingDate ||
        demoPlot?.startDate,
    );
    if (resolvedPlantingDate) setT7PlantingDate(resolvedPlantingDate);

    const resolvedInitialSprayDate = toDateString(
      actualData?.t7InitialSprayDate ||
        dedicated7a?.firstSprayDate ||
        demoPlot?.initialSprayDate,
    );
    if (resolvedInitialSprayDate) setT7InitialSprayDate(resolvedInitialSprayDate);

    const resolvedNextSprayDate = toDateString(
      actualData?.t7NextSprayDate ||
        dedicated7a?.nextSprayDate ||
        demoPlot?.nextSprayDate,
    );
    if (resolvedNextSprayDate) setT7NextSprayDate(resolvedNextSprayDate);

    // Crop Age & Stage
    const resolvedCropAgeVal =
      actualData?.t7CropAgeValue != null
        ? String(actualData.t7CropAgeValue)
        : dedicated7a?.cropAgeValue != null
        ? String(dedicated7a.cropAgeValue)
        : visit1?.cropAgeValue != null
        ? String(visit1.cropAgeValue)
        : "";
    if (resolvedCropAgeVal) setT7CropAgeValue(resolvedCropAgeVal);

    const resolvedCropAgeUnit =
      actualData?.t7CropAgeUnit ||
      dedicated7a?.cropAgeUnit ||
      visit1?.cropAgeUnit ||
      "วัน";
    if (resolvedCropAgeUnit) setT7CropAgeUnit(resolvedCropAgeUnit);

    const resolvedGrowthStage =
      actualData?.t7GrowthStage ||
      dedicated7a?.growthStage ||
      visit1?.growthStage ||
      "";
    if (resolvedGrowthStage) setT7GrowthStage(resolvedGrowthStage);

    const resolvedNotes =
      actualData?.t7Notes ||
      dedicated7a?.notes ||
      demoPlot?.notes ||
      visit1?.notes ||
      "";
    if (resolvedNotes) setT7Notes(resolvedNotes);

    // 3. Spray Method & External Chemicals
    const resolvedSprayMethod =
      actualData?.t7SprayMethod ||
      dedicated7a?.sprayMethod ||
      demoPlot?.sprayMethod ||
      visit1?.sprayMethod ||
      "SINGLE";
    setT7SprayMethod(resolvedSprayMethod);

    const resolvedHasExternal =
      actualData?.t7HasExternalChemicals != null
        ? actualData.t7HasExternalChemicals
        : dedicated7a?.hasExternalChemicals != null
        ? dedicated7a.hasExternalChemicals
        : demoPlot?.hasExternalChemicals != null
        ? demoPlot.hasExternalChemicals
        : false;
    setT7HasExternalChemicals(Boolean(resolvedHasExternal));

    if (Array.isArray(actualData?.t7ExternalProducts) && actualData.t7ExternalProducts.length > 0) {
      setT7ExternalProducts(actualData.t7ExternalProducts);
    } else if (Array.isArray(dedicated7a?.sprayExternals) && dedicated7a.sprayExternals.length > 0) {
      setT7ExternalProducts(
        dedicated7a.sprayExternals.map((ext: any, idx: number) => ({
          id: ext.id || `ext-${idx}`,
          company: ext.company || "",
          productName: ext.productName || "",
          activeIngredient: ext.activeIngredient || "",
          formula: ext.formula || "SL",
          customFormula: ext.customFormula || "",
          applicationRate: ext.applicationRate || "",
        })),
      );
    } else if (demoPlot?.externalProducts && Array.isArray(demoPlot.externalProducts) && demoPlot.externalProducts.length > 0) {
      setT7ExternalProducts(
        demoPlot.externalProducts.map((ext: any, idx: number) => ({
          id: ext.id || `ext-${idx}`,
          company: ext.company || "",
          productName: ext.productName || "",
          activeIngredient: ext.activeIngredient || "",
          formula: ext.formula || "SL",
          customFormula: ext.customFormula || "",
          applicationRate: ext.applicationRate || "",
        })),
      );
    }

    // 4. Spray Equipment
    const resolvedSprayEquipment =
      actualData?.t7SprayEquipment ||
      dedicated7a?.sprayEquipment ||
      demoPlot?.sprayEquipment ||
      visit1?.sprayEquipment ||
      "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)";
    setT7SprayEquipment(resolvedSprayEquipment);

    const resolvedOtherEquipment =
      actualData?.t7OtherEquipment ||
      dedicated7a?.otherEquipment ||
      demoPlot?.otherEquipment ||
      visit1?.otherEquipment ||
      "";
    if (resolvedOtherEquipment) setT7OtherEquipment(resolvedOtherEquipment);

    // 5. Products (Planned & Additional)
    if (Array.isArray(actualData?.t7PlannedProducts) && actualData.t7PlannedProducts.length > 0) {
      setT7PlannedProducts(actualData.t7PlannedProducts);
    } else if (Array.isArray(dedicated7a?.actualProducts) && dedicated7a.actualProducts.length > 0) {
      const dedicatedPlanned = dedicated7a.actualProducts.filter((p: any) => p.isPlanned);
      if (dedicatedPlanned.length > 0) {
        setT7PlannedProducts(
          dedicatedPlanned.map((p: any) => ({
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "",
            withdrawnQuantity: p.withdrawnQuantity != null ? Number(p.withdrawnQuantity) : 1,
            actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 1,
            extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
            extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
            applicationRate: p.actualRate || "",
          })),
        );
      }
    } else {
      const demoProds = demoPlot?.demoProducts || [];
      const plannedFromDemo = demoProds.filter((p: any) => !p.isAdditional);
      if (plannedFromDemo.length > 0) {
        setT7PlannedProducts(
          plannedFromDemo.map((p: any) => ({
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
          })),
        );
      } else {
        // Fallback: Populate from planned targets
        const planProds = t7aTarget?.products || t7aTarget?.demoProducts || [];
        if (Array.isArray(planProds) && planProds.length > 0) {
          setT7PlannedProducts(
            planProds.map((p: any) => ({
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
    }

    if (Array.isArray(actualData?.t7AdditionalProducts) && actualData.t7AdditionalProducts.length > 0) {
      setT7AdditionalProducts(actualData.t7AdditionalProducts);
    } else if (Array.isArray(dedicated7a?.actualProducts) && dedicated7a.actualProducts.length > 0) {
      const dedicatedAdditional = dedicated7a.actualProducts.filter((p: any) => !p.isPlanned);
      if (dedicatedAdditional.length > 0) {
        setT7AdditionalProducts(
          dedicatedAdditional.map((p: any, idx: number) => ({
            id: p.id || `add-${idx}`,
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "",
            actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 1,
            extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
            extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
            applicationRate: p.actualRate || "",
          })),
        );
      }
    } else {
      const demoProds = demoPlot?.demoProducts || [];
      const additionalFromDemo = demoProds.filter((p: any) => p.isAdditional);
      if (additionalFromDemo.length > 0) {
        setT7AdditionalProducts(
          additionalFromDemo.map((p: any, idx: number) => ({
            id: p.id || `add-${idx}`,
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "",
            actualQuantity: p.quantity != null ? Number(p.quantity) : 1,
            extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
            extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
            applicationRate: p.applicationRate || "",
          })),
        );
      }
    }

    // 6. Initial Photos
    if (Array.isArray(actualData?.t7InitialPhotos) && actualData.t7InitialPhotos.length > 0) {
      setT7InitialPhotos(actualData.t7InitialPhotos);
      initialPhotosRef.current = actualData.t7InitialPhotos;
    } else {
      const allAttachments = [
        ...(dedicated7a?.attachments || []),
        ...(demoPlot?.attachments || []),
        ...(actualData?.attachments || []),
        ...(plan?.attachments || []),
      ];
      const plotAttachments = allAttachments.filter(
        (att: any) =>
          att.category === "PLOT" ||
          att.category === "INITIAL" ||
          att.category === "type7a_plot" ||
          (att.workTypeCode === "TYPE_7A" && att.fileUrl),
      );
      if (plotAttachments.length > 0) {
        const seenUrls = new Set<string>();
        const photos: Type7aImageFile[] = [];
        for (const att of plotAttachments) {
          const url = att.fileUrl || att.url;
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);
            photos.push({
              id: att.id || url,
              url,
              name: att.fileName || "รูปถ่ายสภาพแปลง",
              size: att.fileSize || 0,
            });
          }
        }
        if (photos.length > 0) {
          setT7InitialPhotos(photos);
          initialPhotosRef.current = photos;
        }
      } else if (
        visit1?.plotImageUrls &&
        Array.isArray(visit1.plotImageUrls) &&
        visit1.plotImageUrls.length > 0
      ) {
        const photos: Type7aImageFile[] = visit1.plotImageUrls.map((url: string, idx: number) => ({
          id: `visit-img-${idx}`,
          url,
          name: `รูปถ่ายสภาพแปลง ${idx + 1}`,
        }));
        setT7InitialPhotos(photos);
        initialPhotosRef.current = photos;
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
        case "t7FarmerPhone": setT7FarmerPhone(formatPhoneNumber(value)); break;
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
