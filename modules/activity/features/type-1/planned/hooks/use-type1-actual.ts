"use client";

import { useState, useRef, useCallback } from "react";
import type { Type1ImageFile, Type1AdviceProductItem } from "../../shared/types";
import type { Type1TargetActualItem } from "../types/actual.types";
import { aggregateType1TargetItems } from "../application/actual-mapper";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/ui/utils/image-uploader";

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

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
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
    const imgs = parsed.plotImages || parsed.t1PlotImages;
    if (imgs && imgs.length > 0) {
      setT1PlotImages(imgs);
      initialT1PlotImagesRef.current = JSON.parse(
        JSON.stringify(imgs),
      );
    }
  }, []);

  const syncFromTargetItems = useCallback((items: any[]) => {
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
      let cleanImages = t1PlotImages;
      if (t1PlotImages && t1PlotImages.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t1PlotImages,
          "type1",
          "plot",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT1PlotImages(cleanImages);
      }
      return cleanImages;
    },
    [t1PlotImages],
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
    (uploadedImages: any[] = t1PlotImages) => ({
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
      t1PlotImages: uploadedImages,
      targetActualResults: t1TargetItems,
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
      plotImages: uploadedImages,
    }),
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
    setTargetItems: setT1TargetItems,

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
    setT1TargetItems,

    hydrate,
    syncFromTargetItems,
    uploadImages,
    collectOldImageUrlsToDelete,
    getPayload,
    collectPayload: getPayload,
    commitSavedImages: (imgs?: any[]) => {
      if (imgs) setT1PlotImages(imgs);
    },
  };
}
