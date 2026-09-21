"use client";

import { useState, useRef, useCallback } from "react";
import type {
  ImageFile,
  Type7bProductRateItem,
  Type7bSprayingRoundItem,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
  parseCleanNumber,
} from "@/modules/activity-plans/features/shared/actual-view/utils";
import { recordDemoPlotVisitAction } from "@/modules/activity-plans/server/actions";

export function useType7bActual() {
  const [t7StartDate, setT7StartDate] = useState("");
  const [t7ProductPrice] = useState(500);
  const [t7PlannedProductId, setT7PlannedProductId] = useState<string | null>(null);
  const [t7ActualProductId, setT7ActualProductId] = useState<string | null>(null);
  const [t7ActualQuantity, setT7ActualQuantity] = useState("");
  const [t7ChangeReason, setT7ChangeReason] = useState("");
  const [t7UsageMethod, setT7UsageMethod] = useState("");
  const [t7PlantingDate, setT7PlantingDate] = useState("");
  const [t7PlantingAreaCondition, setT7PlantingAreaCondition] = useState("");
  const [t7CropImages, setT7CropImages] = useState<ImageFile[]>([]);
  const initialT7CropImagesRef = useRef<ImageFile[]>([]);
  const [t7CropAgeValue, setT7CropAgeValue] = useState("");
  const [t7CropAgeUnit, setT7CropAgeUnit] = useState("วัน");
  const [t7GrowthStage, setT7GrowthStage] = useState("");
  const [t7CropCondition, setT7CropCondition] = useState<
    "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | ""
  >("");
  const [t7CropProblemDescription, setT7CropProblemDescription] = useState("");
  const [t7ProductResponse, setT7ProductResponse] = useState<
    "พืชตอบสนองดี" | "พบปัญหา" | ""
  >("");
  const [t7ProblemDescription, setT7ProblemDescription] = useState("");
  const [t7PlotImages, setT7PlotImages] = useState<ImageFile[]>([]);
  const initialT7PlotImagesRef = useRef<ImageFile[]>([]);
  const [t7PlotStatus, setT7PlotStatus] = useState<
    "IN_PROGRESS" | "COMPLETED" | "FAILED"
  >("IN_PROGRESS");
  const [t7NextFollowUpDate, setT7NextFollowUpDate] = useState("");
  const [t7FinalYieldKg, setT7FinalYieldKg] = useState("");
  const [t7ControlYieldKg, setT7ControlYieldKg] = useState("");
  const [t7YieldIncreasePercent, setT7YieldIncreasePercent] = useState("");
  const [t7FarmerSatisfaction, setT7FarmerSatisfaction] = useState(5);
  const [t7CommercialPotential, setT7CommercialPotential] = useState("");
  const [t7FinalSummaryNotes, setT7FinalSummaryNotes] = useState("");
  const [t7DemoPlotId, setT7DemoPlotId] = useState<string | null>(null);
  const [t7VisitHistory, setT7VisitHistory] = useState<any[]>([]);
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);

  const [t7DaysAfterSpray, setT7DaysAfterSpray] = useState<string | number>("");
  const [t7bProductRates, setT7bProductRates] = useState<Type7bProductRateItem[]>([]);
  const [t7SprayEquipment, setT7SprayEquipment] = useState<string>("โดรน");
  const [t7OtherEquipment, setT7OtherEquipment] = useState<string>("");
  const [t7NextSprayDate, setT7NextSprayDate] = useState("");
  const [t7SprayMethod, setT7SprayMethod] = useState<"SINGLE" | "TANK_MIXED">("SINGLE");
  const [t7HasExternalChemicals, setT7HasExternalChemicals] = useState(false);
  const [t7ExternalProducts, setT7ExternalProducts] = useState<any[]>([]);
  const [t7bSprayingRounds, setT7bSprayingRounds] = useState<Type7bSprayingRoundItem[]>([]);
  const initialT7bSprayingRoundsRef = useRef<Type7bSprayingRoundItem[]>([]);

  const hydrate = useCallback((plan: any, parsed: any, extractedTargets?: any) => {
    if (extractedTargets?.t7?.plannedProductId) {
      setT7PlannedProductId(extractedTargets.t7.plannedProductId);
    } else if (extractedTargets?.t7?.productId) {
      setT7PlannedProductId(extractedTargets.t7.productId);
    }
    if (extractedTargets?.t7?.demoProductQuantity) {
      setT7ActualQuantity(String(extractedTargets.t7.demoProductQuantity));
    }

    const linkedDemoPlot =
      plan?.demoPlotVisits?.[0]?.demoPlot || plan?.demoPlot;

    if (linkedDemoPlot) {
      const dp = linkedDemoPlot;
      setT7DemoPlotId(dp.id);
      setT7DemoPlotData(dp);
      if (dp.demoProducts && dp.demoProducts.length > 0) {
        const existingDemoResults = plan?.result?.demoResults || [];
        const rates: Type7bProductRateItem[] = dp.demoProducts.map(
          (dpr: any) => {
            const matched = existingDemoResults.find(
              (dr: any) =>
                dr.plannedProductId === dpr.productId ||
                dr.actualProductId === dpr.productId,
            );
            return {
              productId: dpr.productId,
              productName:
                dpr.product?.name || dpr.productName || "สินค้าสาธิต",
              baselineRate: dpr.applicationRate || "",
              actualRate: matched?.applicationRate || "",
            };
          },
        );
        setT7bProductRates(rates);
      }

      const latestVisit =
        (dp.visits && dp.visits.length > 0
          ? dp.visits[dp.visits.length - 1]
          : null) ||
        (plan?.demoPlotVisits && plan?.demoPlotVisits.length > 0
          ? plan?.demoPlotVisits[plan?.demoPlotVisits.length - 1]
          : null);

      if (latestVisit) {
        if (latestVisit.visitDate) {
          setT7StartDate(
            new Date(latestVisit.visitDate).toISOString().split("T")[0],
          );
        }
        if (latestVisit.cropAgeValue != null)
          setT7CropAgeValue(String(latestVisit.cropAgeValue));
        if (latestVisit.cropAgeUnit)
          setT7CropAgeUnit(latestVisit.cropAgeUnit);
        if (latestVisit.growthStage)
          setT7GrowthStage(latestVisit.growthStage);
        if (latestVisit.cropCondition)
          setT7CropCondition(latestVisit.cropCondition);
        if (latestVisit.cropProblemDesc)
          setT7CropProblemDescription(latestVisit.cropProblemDesc);
        if (latestVisit.productResponse)
          setT7ProductResponse(latestVisit.productResponse);
        if (latestVisit.productProblemDesc)
          setT7ProblemDescription(latestVisit.productProblemDesc);
        if (latestVisit.daysSinceStart != null)
          setT7DaysAfterSpray(String(latestVisit.daysSinceStart));
        if (latestVisit.sprayMethod)
          setT7SprayMethod(latestVisit.sprayMethod as any);
        if (latestVisit.sprayEquipment)
          setT7SprayEquipment(latestVisit.sprayEquipment);
        if (latestVisit.otherEquipment)
          setT7OtherEquipment(latestVisit.otherEquipment);
        if (latestVisit.notes)
          setT7UsageMethod(latestVisit.notes);
      }
    }

    if (parsed) {
      if (parsed.t7PlannedProductId) {
        setT7PlannedProductId(parsed.t7PlannedProductId);
      }
      if (parsed.t7ActualProductId) {
        setT7ActualProductId(parsed.t7ActualProductId);
      }
      if (parsed.t7DemoProductQuantity) {
        setT7ActualQuantity(String(parsed.t7DemoProductQuantity));
      }
      if (parsed.t7ChangeReason) {
        setT7ChangeReason(parsed.t7ChangeReason);
      }
      if (parsed.t7DemoPlotId) {
        setT7DemoPlotId(parsed.t7DemoPlotId);
      }
      if (parsed.t7UsageMethod) setT7UsageMethod(parsed.t7UsageMethod);
      if (parsed.t7CropAgeValue) setT7CropAgeValue(parsed.t7CropAgeValue);
      if (parsed.t7CropAgeUnit) setT7CropAgeUnit(parsed.t7CropAgeUnit);
      if (parsed.t7GrowthStage) setT7GrowthStage(parsed.t7GrowthStage);
      if (parsed.t7CropCondition)
        setT7CropCondition(parsed.t7CropCondition);
      if (parsed.t7CropProblemDescription) {
        setT7CropProblemDescription(parsed.t7CropProblemDescription);
      }
      if (parsed.t7ProductResponse) {
        setT7ProductResponse(parsed.t7ProductResponse);
      }
      if (parsed.t7ProblemDescription) {
        setT7ProblemDescription(parsed.t7ProblemDescription);
      }
      if (parsed.t7PlantingDate) setT7PlantingDate(parsed.t7PlantingDate);
      if (parsed.t7PlantingAreaCondition) {
        setT7PlantingAreaCondition(parsed.t7PlantingAreaCondition);
      }
      if (parsed.t7PlotStatus) setT7PlotStatus(parsed.t7PlotStatus);
      if (parsed.t7NextFollowUpDate) {
        setT7NextFollowUpDate(parsed.t7NextFollowUpDate);
      }
      if (parsed.t7FinalYieldKg) setT7FinalYieldKg(parsed.t7FinalYieldKg);
      if (parsed.t7ControlYieldKg) {
        setT7ControlYieldKg(parsed.t7ControlYieldKg);
      }
      if (parsed.t7YieldIncreasePercent) {
        setT7YieldIncreasePercent(parsed.t7YieldIncreasePercent);
      }
      if (parsed.t7FarmerSatisfaction) {
        setT7FarmerSatisfaction(parsed.t7FarmerSatisfaction);
      }
      if (parsed.t7CommercialPotential) {
        setT7CommercialPotential(parsed.t7CommercialPotential);
      }
      if (parsed.t7FinalSummaryNotes) {
        setT7FinalSummaryNotes(parsed.t7FinalSummaryNotes);
      }
      if (parsed.t7DaysAfterSpray) {
        setT7DaysAfterSpray(parsed.t7DaysAfterSpray);
      }
      if (parsed.t7SprayEquipment) {
        setT7SprayEquipment(parsed.t7SprayEquipment);
      }
      if (parsed.t7OtherEquipment) {
        setT7OtherEquipment(parsed.t7OtherEquipment);
      }
      if (parsed.t7NextSprayDate) {
        setT7NextSprayDate(parsed.t7NextSprayDate);
      }
      if (parsed.t7CropImages && parsed.t7CropImages.length > 0) {
        setT7CropImages(parsed.t7CropImages);
        initialT7CropImagesRef.current = JSON.parse(
          JSON.stringify(parsed.t7CropImages),
        );
      }
      if (parsed.t7PlotImages && parsed.t7PlotImages.length > 0) {
        setT7PlotImages(parsed.t7PlotImages);
        initialT7PlotImagesRef.current = JSON.parse(
          JSON.stringify(parsed.t7PlotImages),
        );
      }
      if (parsed.t7bSprayingRounds && parsed.t7bSprayingRounds.length > 0) {
        setT7bSprayingRounds(parsed.t7bSprayingRounds);
        initialT7bSprayingRoundsRef.current = JSON.parse(
          JSON.stringify(parsed.t7bSprayingRounds),
        );
      }
    }
  }, []);

  const uploadImages = useCallback(
    async (
      planId: string,
      plotItemId: string,
      newlyUploadedUrls: string[],
    ): Promise<{
      cleanCropImages: ImageFile[];
      cleanPlotImages: ImageFile[];
      cleanRounds: Type7bSprayingRoundItem[];
    }> => {
      let cleanCropImages = t7CropImages;
      let cleanPlotImages = t7PlotImages;

      if (t7CropImages && t7CropImages.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t7CropImages,
          "crop",
          plotItemId,
        );
        cleanCropImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT7CropImages(cleanCropImages);
      }

      if (t7PlotImages && t7PlotImages.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t7PlotImages,
          "plot",
          plotItemId,
        );
        cleanPlotImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT7PlotImages(cleanPlotImages);
      }

      let cleanRounds = t7bSprayingRounds;
      if (t7bSprayingRounds && t7bSprayingRounds.length > 0) {
        cleanRounds = await Promise.all(
          t7bSprayingRounds.map(async (round) => {
            if (round.plotImages && round.plotImages.length > 0) {
              const res = await uploadActivityPlanImageGroup(
                planId,
                round.plotImages,
                `spray-round-${round.roundNumber}`,
                plotItemId,
              );
              newlyUploadedUrls.push(...res.newlyUploadedUrls);
              return {
                ...round,
                plotImages: res.updatedImages,
              };
            }
            return round;
          }),
        );
        setT7bSprayingRounds(cleanRounds);
      }

      return { cleanCropImages, cleanPlotImages, cleanRounds };
    },
    [t7CropImages, t7PlotImages, t7bSprayingRounds],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (
      currentCropImages: ImageFile[] = t7CropImages,
      currentPlotImages: ImageFile[] = t7PlotImages,
      currentRounds: Type7bSprayingRoundItem[] = t7bSprayingRounds,
    ): string[] => {
      const initialCropUrls = collectPermanentUrls(initialT7CropImagesRef.current);
      const currentCropUrls = new Set(collectPermanentUrls(currentCropImages));
      const oldCrop = initialCropUrls.filter((u) => !currentCropUrls.has(u));

      const initialPlotUrls = collectPermanentUrls(initialT7PlotImagesRef.current);
      const currentPlotUrls = new Set(collectPermanentUrls(currentPlotImages));
      const oldPlot = initialPlotUrls.filter((u) => !currentPlotUrls.has(u));

      const initialRoundUrls = (initialT7bSprayingRoundsRef.current || []).flatMap(
        (r) => collectPermanentUrls(r.plotImages),
      );
      const currentRoundUrls = new Set(
        currentRounds.flatMap((r) => collectPermanentUrls(r.plotImages)),
      );
      const oldRounds = initialRoundUrls.filter((u) => !currentRoundUrls.has(u));

      return [...oldCrop, ...oldPlot, ...oldRounds];
    },
    [t7CropImages, t7PlotImages, t7bSprayingRounds],
  );

  const commitSavedImages = useCallback(
    (
      savedCropImages: ImageFile[] = t7CropImages,
      savedPlotImages: ImageFile[] = t7PlotImages,
      savedRounds: Type7bSprayingRoundItem[] = t7bSprayingRounds,
    ) => {
      initialT7CropImagesRef.current = JSON.parse(JSON.stringify(savedCropImages));
      initialT7PlotImagesRef.current = JSON.parse(JSON.stringify(savedPlotImages));
      initialT7bSprayingRoundsRef.current = JSON.parse(JSON.stringify(savedRounds));
    },
    [t7CropImages, t7PlotImages, t7bSprayingRounds],
  );

  const recordVisit = useCallback(
    async (planId: string, plotIdentifier: string, cleanCropImages: ImageFile[], cleanPlotImages: ImageFile[]) => {
      const qty = parseCleanNumber(t7ActualQuantity) ?? 0;
      return recordDemoPlotVisitAction({
        demoPlotId: plotIdentifier,
        activityPlanId: planId,
        visitDate: t7StartDate ? new Date(t7StartDate) : new Date(),
        daysSinceStart:
          t7DaysAfterSpray !== "" && t7DaysAfterSpray != null
            ? Number(t7DaysAfterSpray)
            : undefined,
        cropAgeValue: parseCleanNumber(t7CropAgeValue),
        cropAgeUnit: t7CropAgeUnit,
        growthStage: t7GrowthStage,
        cropCondition: t7CropCondition,
        cropProblemDesc: t7CropProblemDescription,
        productResponse: t7ProductResponse,
        productProblemDesc: t7ProblemDescription,
        usageMethod: t7UsageMethod,
        notes: t7UsageMethod,
        sprayMethod: t7SprayMethod,
        sprayEquipment: t7SprayEquipment,
        otherEquipment: t7OtherEquipment,
        externalProducts:
          t7SprayMethod === "TANK_MIXED" && t7HasExternalChemicals
            ? t7ExternalProducts
            : [],
        nextSprayDate: t7NextSprayDate ? new Date(t7NextSprayDate) : null,
        plantingDate: t7PlantingDate,
        plantingAreaCondition: t7PlantingAreaCondition,
        productUsedQty: qty,
        productUnitPrice: parseCleanNumber(t7ProductPrice) ?? 500,
        cropImageUrls: collectPermanentUrls(cleanCropImages),
        plotImageUrls: collectPermanentUrls(cleanPlotImages),
        imageUrls: collectPermanentUrls(cleanPlotImages),
        plotStatus: t7PlotStatus,
        finalYieldKg: parseCleanNumber(t7FinalYieldKg),
        controlYieldKg: parseCleanNumber(t7ControlYieldKg),
        yieldIncreasePercent: parseCleanNumber(t7YieldIncreasePercent),
        farmerSatisfaction: t7FarmerSatisfaction,
        commercialPotential: t7CommercialPotential,
        finalSummaryNotes: t7FinalSummaryNotes,
      }).catch((err) =>
        console.error("Failed to save DemoPlotVisit:", err),
      );
    },
    [
      t7ActualQuantity,
      t7StartDate,
      t7DaysAfterSpray,
      t7CropAgeValue,
      t7CropAgeUnit,
      t7GrowthStage,
      t7CropCondition,
      t7CropProblemDescription,
      t7ProductResponse,
      t7ProblemDescription,
      t7UsageMethod,
      t7SprayMethod,
      t7SprayEquipment,
      t7OtherEquipment,
      t7HasExternalChemicals,
      t7ExternalProducts,
      t7NextSprayDate,
      t7PlantingDate,
      t7PlantingAreaCondition,
      t7ProductPrice,
      t7PlotStatus,
      t7FinalYieldKg,
      t7ControlYieldKg,
      t7YieldIncreasePercent,
      t7FarmerSatisfaction,
      t7CommercialPotential,
      t7FinalSummaryNotes,
    ],
  );

  const collectPayload = useCallback(
    (context: {
      cleanCropImages?: ImageFile[];
      cleanPlotImages?: ImageFile[];
      cleanRounds?: Type7bSprayingRoundItem[];
      products: any[];
      targets: any;
    }) => {
      const cleanCrop = context.cleanCropImages || t7CropImages;
      const cleanPlot = context.cleanPlotImages || t7PlotImages;
      const cleanRounds = context.cleanRounds || t7bSprayingRounds;

      const plannedProdId =
        t7PlannedProductId ||
        context.targets?.t7?.plannedProductId ||
        context.targets?.t7?.productId ||
        null;

      const actualProdId =
        t7ActualProductId ||
        t7PlannedProductId ||
        context.targets?.t7?.plannedProductId ||
        context.targets?.t7?.productId ||
        null;

      const plannedProdName =
        context.products.find((p) => p.id === plannedProdId)?.name ||
        context.targets?.t7?.product ||
        null;

      const actualProdName =
        context.products.find((p) => p.id === actualProdId)?.name ||
        context.targets?.t7?.product ||
        null;

      return {
        t7PlannedProductId: plannedProdId,
        t7ActualProductId: actualProdId,
        t7PlannedProductName: plannedProdName,
        t7ActualProductName: actualProdName,
        t7DemoProductQuantity:
          t7ActualQuantity || context.targets?.t7?.demoProductQuantity || null,
        t7ChangeReason,
        t7PlantingDate,
        t7PlantingAreaCondition,
        t7CropAgeValue,
        t7CropAgeUnit,
        t7GrowthStage,
        t7CropCondition,
        t7CropProblemDescription,
        t7ProductResponse,
        t7ProblemDescription,
        t7PlotStatus,
        t7NextFollowUpDate,
        t7FinalYieldKg,
        t7ControlYieldKg,
        t7YieldIncreasePercent,
        t7FarmerSatisfaction,
        t7CommercialPotential,
        t7FinalSummaryNotes,
        t7CropImages: cleanCrop,
        t7PlotImages: cleanPlot,
        t7DaysAfterSpray,
        t7bProductRates,
        t7SprayEquipment,
        t7OtherEquipment,
        actualStartDate: t7StartDate,
        t7bSprayingRounds: cleanRounds,
      };
    },
    [
      t7PlannedProductId,
      t7ActualProductId,
      t7ActualQuantity,
      t7ChangeReason,
      t7PlantingDate,
      t7PlantingAreaCondition,
      t7CropAgeValue,
      t7CropAgeUnit,
      t7GrowthStage,
      t7CropCondition,
      t7CropProblemDescription,
      t7ProductResponse,
      t7ProblemDescription,
      t7PlotStatus,
      t7NextFollowUpDate,
      t7FinalYieldKg,
      t7ControlYieldKg,
      t7YieldIncreasePercent,
      t7FarmerSatisfaction,
      t7CommercialPotential,
      t7FinalSummaryNotes,
      t7CropImages,
      t7PlotImages,
      t7DaysAfterSpray,
      t7bProductRates,
      t7SprayEquipment,
      t7OtherEquipment,
      t7StartDate,
      t7bSprayingRounds,
    ],
  );

  return {
    t7StartDate,
    setT7StartDate,
    t7ProductPrice,
    t7PlannedProductId,
    setT7PlannedProductId,
    t7ActualProductId,
    setT7ActualProductId,
    t7ActualQuantity,
    setT7ActualQuantity,
    t7ChangeReason,
    setT7ChangeReason,
    t7UsageMethod,
    setT7UsageMethod,
    t7PlantingDate,
    setT7PlantingDate,
    t7PlantingAreaCondition,
    setT7PlantingAreaCondition,
    t7CropImages,
    setT7CropImages,
    t7CropAgeValue,
    setT7CropAgeValue,
    t7CropAgeUnit,
    setT7CropAgeUnit,
    t7GrowthStage,
    setT7GrowthStage,
    t7CropCondition,
    setT7CropCondition,
    t7CropProblemDescription,
    setT7CropProblemDescription,
    t7ProductResponse,
    setT7ProductResponse,
    t7ProblemDescription,
    setT7ProblemDescription,
    t7PlotImages,
    setT7PlotImages,
    t7PlotStatus,
    setT7PlotStatus,
    t7NextFollowUpDate,
    setT7NextFollowUpDate,
    t7FinalYieldKg,
    setT7FinalYieldKg,
    t7ControlYieldKg,
    setT7ControlYieldKg,
    t7YieldIncreasePercent,
    setT7YieldIncreasePercent,
    t7FarmerSatisfaction,
    setT7FarmerSatisfaction,
    t7CommercialPotential,
    setT7CommercialPotential,
    t7FinalSummaryNotes,
    setT7FinalSummaryNotes,
    t7DemoPlotId,
    setT7DemoPlotId,
    t7VisitHistory,
    setT7VisitHistory,
    t7DemoPlotData,
    setT7DemoPlotData,
    t7DaysAfterSpray,
    setT7DaysAfterSpray,
    t7bProductRates,
    setT7bProductRates,
    t7SprayEquipment,
    setT7SprayEquipment,
    t7OtherEquipment,
    setT7OtherEquipment,
    t7NextSprayDate,
    setT7NextSprayDate,
    t7SprayMethod,
    setT7SprayMethod,
    t7HasExternalChemicals,
    setT7HasExternalChemicals,
    t7ExternalProducts,
    setT7ExternalProducts,
    t7bSprayingRounds,
    setT7bSprayingRounds,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    recordVisit,
    collectPayload,
  };
}
