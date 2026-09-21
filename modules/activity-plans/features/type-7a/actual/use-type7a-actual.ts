"use client";

import { useState, useRef, useCallback } from "react";
import type {
  ImageFile,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType7aActual() {
  const [t7FarmerProvince, setT7FarmerProvince] = useState("");
  const [t7FarmerCustomerId, setT7FarmerCustomerId] = useState<string | null>(null);
  const [t7FarmerName, setT7FarmerName] = useState("");
  const [t7FarmerPhone, setT7FarmerPhone] = useState("");
  const [t7IsUnregisteredFarmer, setT7IsUnregisteredFarmer] = useState(false);
  const [t7DealerName, setT7DealerName] = useState("");
  const [t7DealerCode, setT7DealerCode] = useState("");
  const [t7Latitude, setT7Latitude] = useState("");
  const [t7Longitude, setT7Longitude] = useState("");
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
  const [t7InitialSprayDate, setT7InitialSprayDate] = useState("");
  const [t7NextSprayDate, setT7NextSprayDate] = useState("");
  const [t7DemoProducts, setT7DemoProducts] = useState<DemoPlotProductItem[]>([]);
  const [t7SprayMethod, setT7SprayMethod] = useState<"SINGLE" | "TANK_MIXED">("SINGLE");
  const [t7HasExternalChemicals, setT7HasExternalChemicals] = useState(false);
  const [t7ExternalProducts, setT7ExternalProducts] = useState<DemoPlotExternalProductItem[]>([]);
  const [t7InitialPhotos, setT7InitialPhotos] = useState<ImageFile[]>([]);
  const initialT7InitialPhotosRef = useRef<ImageFile[]>([]);
  const [t7PlotName, setT7PlotName] = useState("");
  const [t7CustomPlotDetail, setT7CustomPlotDetail] = useState("");
  const [t7UsageMethod, setT7UsageMethod] = useState("");
  const [t7DemoPlotId, setT7DemoPlotId] = useState<string | null>(null);
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);

  const hydrate = useCallback((plan: any, parsed: any, extractedTargets?: any) => {
    const t7aTarget = extractedTargets?.t7a || extractedTargets?.t7;
    const linkedDemoPlot =
      plan?.demoPlotVisits?.[0]?.demoPlot || plan?.demoPlot;

    if (linkedDemoPlot) {
      const dp = linkedDemoPlot;
      setT7DemoPlotId(dp.id);
      setT7DemoPlotData(dp);
      if (dp.ownerProvince) {
        setT7FarmerProvince(dp.ownerProvince);
      } else if (dp.farmerCustomer?.province) {
        setT7FarmerProvince(dp.farmerCustomer.province);
      }
      if (dp.district) setT7District(dp.district);
      if (dp.farmerCustomerId) {
        setT7FarmerCustomerId(dp.farmerCustomerId);
        setT7IsUnregisteredFarmer(false);
      } else {
        setT7FarmerCustomerId("");
        setT7IsUnregisteredFarmer(Boolean(dp.isUnregisteredFarmer));
      }
      if (dp.ownerName) setT7FarmerName(dp.ownerName);
      if (dp.ownerPhone) setT7FarmerPhone(dp.ownerPhone);
      const resolvedDealerName =
        (dp.customer?.customerType !== "FARMER" ? dp.customer?.name : "") ||
        (extractedTargets?.t7a as any)?.dealerName ||
        (t7aTarget as any)?.dealerName ||
        "";
      if (resolvedDealerName) setT7DealerName(resolvedDealerName);
      const resolvedDealerCode =
        (dp.customer?.customerType !== "FARMER" ? dp.customer?.customerCode : "") ||
        (extractedTargets?.t7a as any)?.dealerCode ||
        (t7aTarget as any)?.dealerCode ||
        "";
      if (resolvedDealerCode) setT7DealerCode(resolvedDealerCode);
      if (dp.latitude != null) setT7Latitude(String(dp.latitude));
      if (dp.longitude != null) setT7Longitude(String(dp.longitude));
      const resolvedPlotName = dp.name || dp.plotName;
      if (resolvedPlotName) setT7PlotName(resolvedPlotName);
      if (dp.cropCategory) setT7CropCategory(dp.cropCategory);
      if (dp.cropName) setT7CropName(dp.cropName);
      if (dp.customCropName) setT7CustomCropName(dp.customCropName);
      if (dp.areaRai != null) setT7AreaRai(String(dp.areaRai));
      if (dp.treeCount != null) setT7TreeCount(String(dp.treeCount));
      if (dp.objective) setT7PlotObjective(dp.objective);
      if (dp.experimentDetail) setT7ExperimentDetail(dp.experimentDetail);
      const resolvedMainCropInfo = dp.mainCropInfo || dp.plantingAreaCondition;
      if (resolvedMainCropInfo) setT7MainCropInfo(resolvedMainCropInfo);
      if (dp.irrigations && dp.irrigations.length > 0) {
        setT7Irrigations(dp.irrigations.map((ir: any) => ir.method || ir.methodName));
      }
      if (dp.initialSprayDate) {
        setT7InitialSprayDate(
          new Date(dp.initialSprayDate).toISOString().split("T")[0],
        );
      }
      if (dp.nextSprayDate) {
        setT7NextSprayDate(
          new Date(dp.nextSprayDate).toISOString().split("T")[0],
        );
      }
      if (dp.sprayMethod) setT7SprayMethod(dp.sprayMethod);
      if (dp.hasExternalChemicals != null)
        setT7HasExternalChemicals(Boolean(dp.hasExternalChemicals));
      if (dp.externalProducts && dp.externalProducts.length > 0) {
        setT7ExternalProducts(
          dp.externalProducts.map((ep: any) => ({
            company: ep.company,
            productName: ep.productName,
            activeIngredient: ep.activeIngredient || "",
            formula: ep.formula,
            customFormula: ep.customFormula || "",
            applicationRate: ep.applicationRate,
          })),
        );
      }
      if (dp.demoProducts && dp.demoProducts.length > 0) {
        const planT7aProducts = (
          plan?.products ||
          plan?.planProducts ||
          []
        ).filter(
          (pr: any) =>
            pr.workTypeCode === "TYPE_7A" ||
            pr.workTypeCode === "TYPE_7" ||
            !pr.workTypeCode,
        );
        setT7DemoProducts(
          dp.demoProducts.map((dpr: any) => {
            const matchedPlan = planT7aProducts.find(
              (pr: any) => pr.productId === dpr.productId,
            );
            const plannedQty =
              matchedPlan?.targetQuantity != null
                ? matchedPlan.targetQuantity
                : matchedPlan?.quantity != null
                  ? matchedPlan.quantity
                  : null;
            const usedQty = dpr.quantity ?? (plannedQty != null ? plannedQty : 1);
            const remainingQty =
              dpr.remainingQuantity !== null && dpr.remainingQuantity !== undefined
                ? dpr.remainingQuantity
                : plannedQty != null && usedQty != null
                  ? Math.max(0, Number(plannedQty) - Number(usedQty))
                  : null;

            return {
              id: dpr.id,
              productId: dpr.productId,
              productName: dpr.product?.name || dpr.productName || "",
              plannedQuantity: plannedQty,
              quantity: usedQty,
              remainingQuantity: remainingQty,
              unit: dpr.product?.unit || dpr.product?.packageSizeUnit || dpr.unit || "",
              applicationRate: dpr.applicationRate || "",
              isAdditional: !matchedPlan,
            };
          }),
        );
      } else {
        const planT7aProducts = (
          plan?.products ||
          plan?.planProducts ||
          []
        ).filter(
          (pr: any) =>
            pr.workTypeCode === "TYPE_7A" ||
            pr.workTypeCode === "TYPE_7" ||
            !pr.workTypeCode,
        );
        if (planT7aProducts.length > 0) {
          setT7DemoProducts(
            planT7aProducts.map((pr: any, idx: number) => {
              const plannedQty = pr.targetQuantity ?? pr.quantity ?? 1;
              const usedQty = plannedQty;
              const remainingQty = Math.max(0, Number(plannedQty) - Number(usedQty));
              return {
                id: pr.id || String(idx + 1),
                productId: pr.productId,
                productName: pr.product?.name || pr.productName || "",
                plannedQuantity: plannedQty,
                quantity: usedQty,
                remainingQuantity: remainingQty,
                unit: pr.product?.unit || pr.product?.packageSizeUnit || pr.unit || "",
                applicationRate: "",
                isAdditional: false,
              };
            }),
          );
        } else if (t7aTarget?.demoProducts && t7aTarget.demoProducts.length > 0) {
          setT7DemoProducts(
            t7aTarget.demoProducts.map((pr: any, idx: number) => {
              const plannedQty = pr.quantity ?? 1;
              return {
                id: String(idx + 1),
                productId: pr.productId,
                productName: pr.productName || "",
                plannedQuantity: plannedQty,
                quantity: plannedQty,
                remainingQuantity: 0,
                unit: pr.unit || "",
                applicationRate: "",
                isAdditional: false,
              };
            }),
          );
        }
      }
      const resolvedUsageMethod = dp.usageMethod || dp.notes;
      if (resolvedUsageMethod) setT7UsageMethod(resolvedUsageMethod);

      if (dp.attachments && dp.attachments.length > 0) {
        const mapped = dp.attachments.map((a: any) => ({
          id: a.id,
          url: a.fileUrl,
          name: a.fileName || "image.jpg",
          size: a.fileSize || 0,
          type: a.fileType || "image/jpeg",
        }));
        setT7InitialPhotos(mapped);
        initialT7InitialPhotosRef.current = JSON.parse(
          JSON.stringify(mapped),
        );
      }
    } else {
      if (t7aTarget) {
        const fallbackPlotName =
          (t7aTarget as any).plotName || (t7aTarget as any).name;
        if (fallbackPlotName) setT7PlotName(fallbackPlotName);
        if ((t7aTarget as any).district)
          setT7District((t7aTarget as any).district);
        if ((t7aTarget as any).dealerName)
          setT7DealerName((t7aTarget as any).dealerName);
        if ((t7aTarget as any).dealerCode)
          setT7DealerCode((t7aTarget as any).dealerCode);
        if (t7aTarget.owner) setT7FarmerName(t7aTarget.owner);
        if (t7aTarget.crop) setT7CropName(t7aTarget.crop);
        if ((t7aTarget as any).cropCategory)
          setT7CropCategory((t7aTarget as any).cropCategory);
        if ((t7aTarget as any).areaRai != null)
          setT7AreaRai(String((t7aTarget as any).areaRai));
        if ((t7aTarget as any).treeCount != null)
          setT7TreeCount(String((t7aTarget as any).treeCount));
        if (t7aTarget.objective) setT7PlotObjective(t7aTarget.objective);
        if (t7aTarget.experimentDetail || t7aTarget.detail) {
          setT7ExperimentDetail(
            t7aTarget.experimentDetail || t7aTarget.detail || "",
          );
        }
      }
      if ((t7aTarget as any)?.district) {
        setT7District((t7aTarget as any).district);
      } else if (plan?.district) {
        setT7District(plan.district);
      }
      if (plan?.latitude != null) setT7Latitude(String(plan.latitude));
      if (plan?.longitude != null) setT7Longitude(String(plan.longitude));
      if (plan?.stores && plan.stores.length > 0) {
        const storeNames = plan.stores
          .map((s: any) => s.store?.name || s.storeName)
          .filter(Boolean)
          .join(", ");
        if (storeNames) setT7DealerName(storeNames);
      }
      if (plan?.startDate) {
        const sDate = new Date(plan.startDate).toISOString().split("T")[0];
        setT7InitialSprayDate(sDate);
      }

      const planT7aProducts = (
        plan?.products ||
        plan?.planProducts ||
        []
      ).filter(
        (pr: any) =>
          pr.workTypeCode === "TYPE_7A" || !pr.workTypeCode,
      );
      if (planT7aProducts.length > 0) {
        setT7DemoProducts(
          planT7aProducts.map((pr: any) => {
            const plannedQty = pr.targetQuantity ?? pr.quantity ?? 1;
            const usedQty = plannedQty;
            const remainingQty = Math.max(0, Number(plannedQty) - Number(usedQty));
            return {
              productId: pr.productId,
              productName: pr.product?.name || pr.productName || "",
              plannedQuantity: plannedQty,
              quantity: usedQty,
              remainingQuantity: remainingQty,
              unit: pr.product?.unit || pr.product?.packageSizeUnit || "",
              applicationRate: "",
            };
          }),
        );
      }
    }

    if (parsed) {
      if (parsed.t7PlotName) setT7PlotName(parsed.t7PlotName);
      if (parsed.t7PlotObjective) setT7PlotObjective(parsed.t7PlotObjective);
      if (parsed.t7CustomPlotDetail) setT7CustomPlotDetail(parsed.t7CustomPlotDetail);
      if (parsed.t7DemoPlotId) setT7DemoPlotId(parsed.t7DemoPlotId);
      if (parsed.t7UsageMethod) setT7UsageMethod(parsed.t7UsageMethod);
      if (parsed.t7NextSprayDate) setT7NextSprayDate(parsed.t7NextSprayDate);

      if ((parsed as any).type7aDemoPlot) {
        const dp = (parsed as any).type7aDemoPlot;
        if (dp.ownerProvince) setT7FarmerProvince(dp.ownerProvince);
        if (dp.district) setT7District(dp.district);
        if (dp.farmerCustomerId) {
          setT7FarmerCustomerId(dp.farmerCustomerId);
          setT7IsUnregisteredFarmer(false);
        }
        if (dp.ownerName) setT7FarmerName(dp.ownerName);
        if (dp.ownerPhone) setT7FarmerPhone(dp.ownerPhone);
        if (dp.isUnregisteredFarmer != null)
          setT7IsUnregisteredFarmer(Boolean(dp.isUnregisteredFarmer));
        if (dp.dealerName) {
          setT7DealerName(dp.dealerName);
        }
        if (dp.latitude != null) setT7Latitude(String(dp.latitude));
        if (dp.longitude != null) setT7Longitude(String(dp.longitude));
        const resolvedPlotName = dp.name || dp.plotName;
        if (resolvedPlotName) setT7PlotName(resolvedPlotName);
        if (dp.cropCategory) setT7CropCategory(dp.cropCategory);
        if (dp.cropName) setT7CropName(dp.cropName);
        if (dp.customCropName) setT7CustomCropName(dp.customCropName);
        if (dp.areaRai != null) setT7AreaRai(String(dp.areaRai));
        if (dp.treeCount != null) setT7TreeCount(String(dp.treeCount));
        if (dp.objective) setT7PlotObjective(dp.objective);
        if (dp.experimentDetail) setT7ExperimentDetail(dp.experimentDetail);
        if (dp.mainCropInfo) setT7MainCropInfo(dp.mainCropInfo);
        if (dp.irrigations && dp.irrigations.length > 0)
          setT7Irrigations(dp.irrigations);
        if (dp.initialSprayDate) {
          setT7InitialSprayDate(
            new Date(dp.initialSprayDate).toISOString().split("T")[0],
          );
        }
        if (dp.nextSprayDate) {
          setT7NextSprayDate(
            new Date(dp.nextSprayDate).toISOString().split("T")[0],
          );
        }
        if (dp.sprayMethod) setT7SprayMethod(dp.sprayMethod);
        if (dp.hasExternalChemicals != null)
          setT7HasExternalChemicals(Boolean(dp.hasExternalChemicals));
        if (dp.externalProducts) setT7ExternalProducts(dp.externalProducts);
        if (dp.demoProducts) setT7DemoProducts(dp.demoProducts);
      }

      const t7aAttachments = (plan?.result?.attachments || []).filter(
        (a: any) =>
          a.workTypeCode === "TYPE_7A" ||
          (a.fileCategory === "PLOT" && a.workTypeCode === "TYPE_7A"),
      );
      if (t7aAttachments.length > 0) {
        const mapped = t7aAttachments.map((a: any) => ({
          id: a.id,
          url: a.fileUrl,
          name: a.fileName || "image.jpg",
          size: a.fileSize || 0,
          type: a.fileType || "image/jpeg",
        }));
        setT7InitialPhotos(mapped);
        initialT7InitialPhotosRef.current = JSON.parse(
          JSON.stringify(mapped),
        );
      }
    }
  }, []);

  const uploadImages = useCallback(
    async (
      planId: string,
      plotItemId: string,
      newlyUploadedUrls: string[],
    ): Promise<ImageFile[]> => {
      let cleanPhotos = t7InitialPhotos;
      if (t7InitialPhotos && t7InitialPhotos.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t7InitialPhotos,
          "plot",
          plotItemId,
        );
        cleanPhotos = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT7InitialPhotos(cleanPhotos);
      }
      return cleanPhotos;
    },
    [t7InitialPhotos],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentPhotos: ImageFile[] = t7InitialPhotos): string[] => {
      const initialUrls = collectPermanentUrls(initialT7InitialPhotosRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentPhotos));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t7InitialPhotos],
  );

  const commitSavedImages = useCallback(
    (savedPhotos: ImageFile[] = t7InitialPhotos) => {
      initialT7InitialPhotosRef.current = JSON.parse(
        JSON.stringify(savedPhotos),
      );
    },
    [t7InitialPhotos],
  );

  const collectPayload = useCallback(
    (cleanPhotos: ImageFile[] = t7InitialPhotos) => {
      return {
        t7PlotName,
        t7PlotObjective,
        t7CustomPlotDetail,
        t7DemoPlotId,
        t7UsageMethod,
        t7FarmerProvince,
        t7FarmerCustomerId,
        t7FarmerName,
        t7FarmerPhone,
        t7IsUnregisteredFarmer,
        t7DealerName,
        t7DealerCode,
        t7Latitude,
        t7Longitude,
        t7District,
        t7CropCategory,
        t7CropName,
        t7CustomCropName,
        t7AreaRai,
        t7TreeCount,
        t7ExperimentDetail,
        t7MainCropInfo,
        t7Irrigations,
        t7InitialSprayDate,
        t7NextSprayDate,
        t7DemoProducts,
        t7SprayMethod,
        t7HasExternalChemicals,
        t7ExternalProducts,
        t7InitialPhotos: cleanPhotos,
      };
    },
    [
      t7PlotName,
      t7PlotObjective,
      t7CustomPlotDetail,
      t7DemoPlotId,
      t7UsageMethod,
      t7FarmerProvince,
      t7FarmerCustomerId,
      t7FarmerName,
      t7FarmerPhone,
      t7IsUnregisteredFarmer,
      t7DealerName,
      t7DealerCode,
      t7Latitude,
      t7Longitude,
      t7District,
      t7CropCategory,
      t7CropName,
      t7CustomCropName,
      t7AreaRai,
      t7TreeCount,
      t7ExperimentDetail,
      t7MainCropInfo,
      t7Irrigations,
      t7InitialSprayDate,
      t7NextSprayDate,
      t7DemoProducts,
      t7SprayMethod,
      t7HasExternalChemicals,
      t7ExternalProducts,
      t7InitialPhotos,
    ],
  );

  return {
    t7FarmerProvince,
    setT7FarmerProvince,
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
    t7InitialSprayDate,
    setT7InitialSprayDate,
    t7NextSprayDate,
    setT7NextSprayDate,
    t7DemoProducts,
    setT7DemoProducts,
    t7SprayMethod,
    setT7SprayMethod,
    t7HasExternalChemicals,
    setT7HasExternalChemicals,
    t7ExternalProducts,
    setT7ExternalProducts,
    t7InitialPhotos,
    setT7InitialPhotos,
    t7PlotName,
    setT7PlotName,
    t7CustomPlotDetail,
    setT7CustomPlotDetail,
    t7UsageMethod,
    setT7UsageMethod,
    t7DemoPlotId,
    setT7DemoPlotId,
    t7DemoPlotData,
    setT7DemoPlotData,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
