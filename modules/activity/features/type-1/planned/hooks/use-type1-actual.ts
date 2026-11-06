"use client";

import { useState, useRef, useCallback } from "react";
import type { Type1ImageFile, Type1AdviceProductItem } from "../../shared/types";
import type { Type1TargetActualItem } from "../types/actual.types";
import type { Type1TargetItem } from "../types/planned.types";
import { aggregateType1TargetItems, parseType1ActualResult } from "../application/actual-mapper";
import { validateType1Actual } from "../application/actual-validation";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/application/media/image-uploader";

export function useType1Actual() {
  const [t1ProductAdvice, setT1ProductAdvice] = useState("");
  const [t1AdvisedProducts, setT1AdvisedProducts] = useState<Type1AdviceProductItem[]>([]);
  const [t1Detail, setT1Detail] = useState("");
  const [t1DiscussionResult, setT1DiscussionResult] = useState("");
  const [t1SalesOpportunity, setT1SalesOpportunity] = useState<
    "สูง" | "ต่ำ" | ""
  >("");
  const [t1NextAction, setT1NextAction] = useState("");
  const [t1NextMeetingDate, setT1NextMeetingDate] = useState("");
  const [t1FarmerHomeAddress, setT1FarmerHomeAddress] = useState("");
  const [t1PlotLatitude, setT1PlotLatitude] = useState<string>("");
  const [t1PlotLongitude, setT1PlotLongitude] = useState<string>("");
  const [t1PlotImages, setT1PlotImages] = useState<Type1ImageFile[]>([]);
  const [t1TargetItems, setT1TargetItems] = useState<Type1TargetActualItem[]>([]);
  const initialT1PlotImagesRef = useRef<Type1ImageFile[]>([]);
  const cleanTargetsRef = useRef<Type1TargetActualItem[]>([]);

  const updateTargetItemsState = useCallback((items: Type1TargetActualItem[]) => {
    cleanTargetsRef.current = items;
    setT1TargetItems(items);
  }, []);

  const hydrate = useCallback((parsedInput: any) => {
    if (!parsedInput) return;
    const mapped = parseType1ActualResult(parsedInput);
    const parsed = { ...mapped, ...parsedInput };

    const advice = parsed.productAdvice || parsed.t1ProductAdvice;
    if (advice) setT1ProductAdvice(advice);
    const prods = parsed.advisedProducts || parsed.products || parsed.t1Products;
    if (prods && prods.length > 0) setT1AdvisedProducts(prods);
    const opp = parsed.salesOpportunity || parsed.t1SalesOpportunity;
    if (opp) setT1SalesOpportunity(opp);
    const disc = parsed.discussionResult || parsed.t1DiscussionResult;
    if (disc) setT1DiscussionResult(disc);
    const n = parsed.notes || parsed.detail || parsed.t1Detail;
    if (n) setT1Detail(n);
    const act = parsed.nextAction || parsed.t1NextAction;
    if (act) setT1NextAction(act);
    const meet = parsed.nextMeetingDate || parsed.t1NextMeetingDate;
    if (meet) {
      setT1NextMeetingDate(
        typeof meet === "string"
          ? meet.split("T")[0]
          : meet instanceof Date
            ? meet.toISOString().split("T")[0]
            : String(meet),
      );
    }
    const addr = parsed.farmerHomeAddress || parsed.t1FarmerHomeAddress;
    if (addr) setT1FarmerHomeAddress(addr);
    const lat = parsed.plotLatitude ?? parsed.t1PlotLatitude;
    if (lat != null && lat !== "") setT1PlotLatitude(String(lat));
    const lng = parsed.plotLongitude ?? parsed.t1PlotLongitude;
    if (lng != null && lng !== "") setT1PlotLongitude(String(lng));

    const targets = parsed.targetActualResults || parsed.targetItems;
    if (targets && Array.isArray(targets) && targets.length > 0) {
      cleanTargetsRef.current = targets;
      setT1TargetItems(targets);
    }

    let imgs = parsed.plotImages || parsed.t1PlotImages;
    if ((!imgs || imgs.length === 0) && Array.isArray(parsed.attachments)) {
      imgs = parsed.attachments
        .filter(
          (att: any) =>
            att &&
            (att.workTypeCode === "TYPE_1" ||
              att.category === "PLOT" ||
              !att.workTypeCode),
        )
        .map((att: any) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "รูปแปลงเกษตรกร",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }
    if (imgs && imgs.length > 0) {
      setT1PlotImages(imgs);
      initialT1PlotImagesRef.current = JSON.parse(
        JSON.stringify(imgs),
      );
    }
  }, []);

  const syncFromTargetItems = useCallback((items: any[]) => {
    cleanTargetsRef.current = items;
    setT1TargetItems(items);
    const agg = aggregateType1TargetItems(items);
    setT1DiscussionResult(agg.discussionResult);
    setT1ProductAdvice(agg.productAdvice);
    setT1AdvisedProducts(agg.advisedProducts);
    setT1SalesOpportunity(agg.salesOpportunity);
    setT1NextAction(agg.nextAction);
    setT1NextMeetingDate(agg.nextMeetingDate);
    setT1FarmerHomeAddress(agg.farmerHomeAddress);
    setT1PlotLatitude(agg.plotLatitude);
    setT1PlotLongitude(agg.plotLongitude);
    setT1PlotImages(agg.plotImages);
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<Type1ImageFile[]> => {
      const currentTargets = cleanTargetsRef.current.length > 0 ? cleanTargetsRef.current : t1TargetItems;

      if (currentTargets && currentTargets.length > 0) {
        const updatedTargets: Type1TargetActualItem[] = [];
        const allUploaded: Type1ImageFile[] = [];

        for (const target of currentTargets) {
          const targetKey = target.id || target.targetId || "plot";
          if (target.plotImages && target.plotImages.length > 0) {
            const res = await uploadActivityPlanImageGroup(
              planId,
              target.plotImages,
              "type1",
              targetKey,
            );
            const tagged: Type1ImageFile[] = res.updatedImages.map((img) => ({
              id: img.id,
              url: img.url,
              name: img.name || "รูปแปลงเกษตรกร",
              size: img.size || 0,
              type: img.type || "image/jpeg",
              targetId: targetKey,
              storeId: target.storeId || undefined,
            }));
            newlyUploadedUrls.push(...res.newlyUploadedUrls);
            updatedTargets.push({ ...target, plotImages: tagged });
            allUploaded.push(...tagged);
          } else {
            updatedTargets.push(target);
          }
        }

        cleanTargetsRef.current = updatedTargets;
        setT1TargetItems(updatedTargets);
        setT1PlotImages(allUploaded);
        return allUploaded;
      }

      let cleanImages = t1PlotImages;
      if (t1PlotImages && t1PlotImages.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t1PlotImages,
          "type1",
          "plot",
        );
        cleanImages = res.updatedImages.map((img) => ({
          id: img.id,
          url: img.url,
          name: img.name || "รูปแปลงเกษตรกร",
          size: img.size || 0,
          type: img.type || "image/jpeg",
        }));
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT1PlotImages(cleanImages);
      }
      return cleanImages;
    },
    [t1PlotImages, t1TargetItems],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: Type1ImageFile[] = t1PlotImages): string[] => {
      const initialUrls = collectPermanentUrls(initialT1PlotImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t1PlotImages],
  );

  const getPayload = useCallback(
    (
      uploadedImages: any[] = t1PlotImages,
      overrideTargets?: Type1TargetActualItem[],
    ) => {
      const sourceTargets =
        overrideTargets ||
        (cleanTargetsRef.current.length > 0
          ? cleanTargetsRef.current
          : t1TargetItems);

      const sanitizedPlotImages = (uploadedImages || t1PlotImages || []).map(
        (img: any) => ({
          id: img.id,
          url: img.url || img.fileUrl,
          name: img.name || img.fileName || "รูปแปลงเกษตรกร",
          size: img.size || img.fileSize || 0,
          type: img.type || img.mimeType || "image/jpeg",
          targetId: img.targetId,
          storeId: img.storeId,
        }),
      );

      const sanitizedTargets = sourceTargets.map((target) => {
        let tImages = (target.plotImages || []).map((img: any) => ({
          id: img.id,
          url: img.url || img.fileUrl,
          name: img.name || img.fileName || "รูปแปลงเกษตรกร",
          size: img.size || img.fileSize || 0,
          type: img.type || img.mimeType || "image/jpeg",
          targetId: img.targetId || target.id,
          storeId: img.storeId || target.storeId,
        }));

        if (
          tImages.length === 0 &&
          sourceTargets.length === 1 &&
          sanitizedPlotImages.length > 0
        ) {
          tImages = sanitizedPlotImages;
        }

        return {
          ...target,
          plotImages: tImages,
        };
      });

      return {
        t1ProductAdvice,
        t1Products: t1AdvisedProducts,
        t1SalesOpportunity,
        t1DiscussionResult,
        t1Detail,
        t1NextAction,
        t1NextMeetingDate,
        t1FarmerHomeAddress,
        t1PlotLatitude: t1PlotLatitude || "",
        t1PlotLongitude: t1PlotLongitude || "",
        t1PlotImages: sanitizedPlotImages,
        targetActualResults: sanitizedTargets,
        // Clean normalized aliases:
        productAdvice: t1ProductAdvice,
        products: t1AdvisedProducts,
        notes: t1Detail,
        detail: t1Detail,
        discussionResult: t1DiscussionResult,
        salesOpportunity: t1SalesOpportunity,
        nextAction: t1NextAction,
        nextMeetingDate: t1NextMeetingDate,
        farmerHomeAddress: t1FarmerHomeAddress,
        plotLatitude: t1PlotLatitude ? Number(t1PlotLatitude) : null,
        plotLongitude: t1PlotLongitude ? Number(t1PlotLongitude) : null,
        plotImages: sanitizedPlotImages,
      };
    },
    [
      t1ProductAdvice,
      t1AdvisedProducts,
      t1Detail,
      t1DiscussionResult,
      t1SalesOpportunity,
      t1NextAction,
      t1NextMeetingDate,
      t1FarmerHomeAddress,
      t1PlotLatitude,
      t1PlotLongitude,
      t1PlotImages,
      t1TargetItems,
    ],
  );

  return {
    // Canonical Prisma Aliases (Gold Standard)
    productAdvice: t1ProductAdvice,
    setProductAdvice: setT1ProductAdvice,
    advisedProducts: t1AdvisedProducts,
    setAdvisedProducts: setT1AdvisedProducts,
    notes: t1Detail,
    setNotes: setT1Detail,
    discussionResult: t1DiscussionResult,
    setDiscussionResult: setT1DiscussionResult,
    salesOpportunity: t1SalesOpportunity,
    setSalesOpportunity: setT1SalesOpportunity,
    nextAction: t1NextAction,
    setNextAction: setT1NextAction,
    nextMeetingDate: t1NextMeetingDate,
    setNextMeetingDate: setT1NextMeetingDate,
    farmerHomeAddress: t1FarmerHomeAddress,
    setFarmerHomeAddress: setT1FarmerHomeAddress,
    plotLatitude: t1PlotLatitude,
    setPlotLatitude: setT1PlotLatitude,
    plotLongitude: t1PlotLongitude,
    setPlotLongitude: setT1PlotLongitude,
    plotImages: t1PlotImages,
    setPlotImages: setT1PlotImages,
    targetItems: t1TargetItems,
    setTargetItems: updateTargetItemsState,

    // Legacy t1* Prefixed Properties (Backward Compatibility)
    t1ProductAdvice,
    setT1ProductAdvice,
    t1AdvisedProducts,
    setT1AdvisedProducts,
    t1Detail,
    setT1Detail,
    t1DiscussionResult,
    setT1DiscussionResult,
    t1SalesOpportunity,
    setT1SalesOpportunity,
    t1NextAction,
    setT1NextAction,
    t1NextMeetingDate,
    setT1NextMeetingDate,
    t1FarmerHomeAddress,
    setT1FarmerHomeAddress,
    t1PlotLatitude,
    setT1PlotLatitude,
    t1PlotLongitude,
    setT1PlotLongitude,
    t1PlotImages,
    setT1PlotImages,
    t1TargetItems,
    setT1TargetItems: updateTargetItemsState,

    hydrate,
    syncFromTargetItems,
    uploadImages,
    collectOldImageUrlsToDelete,
    getPayload,
    collectPayload: getPayload,
    validate: useCallback(
      (targets: Type1TargetItem[] = []) =>
        validateType1Actual(
          {
            discussionResult: t1DiscussionResult,
            salesOpportunity: t1SalesOpportunity,
            productAdvice: t1ProductAdvice,
            targetItems: cleanTargetsRef.current.length > 0 ? cleanTargetsRef.current : t1TargetItems,
          },
          targets,
        ),
      [t1DiscussionResult, t1SalesOpportunity, t1ProductAdvice, t1TargetItems],
    ),
    commitSavedImages: (imgs?: any[]) => {
      if (imgs) setT1PlotImages(imgs);
    },
  };
}
