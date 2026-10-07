"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType1Actual() {
  const [t1ProductAdvice, setT1ProductAdvice] = useState("");
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
  const [t1PlotImages, setT1PlotImages] = useState<ImageFile[]>([]);
  const initialT1PlotImagesRef = useRef<ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t1ProductAdvice) setT1ProductAdvice(parsed.t1ProductAdvice);
    if (parsed.t1SalesOpportunity) {
      setT1SalesOpportunity(parsed.t1SalesOpportunity);
    }
    if (parsed.t1DiscussionResult) {
      setT1DiscussionResult(parsed.t1DiscussionResult);
    }
    if (parsed.t1Detail) setT1Detail(parsed.t1Detail);
    if (parsed.t1NextAction) setT1NextAction(parsed.t1NextAction);
    if (parsed.t1NextMeetingDate) {
      setT1NextMeetingDate(parsed.t1NextMeetingDate);
    }
    if (parsed.t1FarmerHomeAddress) {
      setT1FarmerHomeAddress(parsed.t1FarmerHomeAddress);
    }
    if (parsed.t1PlotLatitude != null) {
      setT1PlotLatitude(String(parsed.t1PlotLatitude));
    }
    if (parsed.t1PlotLongitude != null) {
      setT1PlotLongitude(String(parsed.t1PlotLongitude));
    }
    if (parsed.t1PlotImages && parsed.t1PlotImages.length > 0) {
      setT1PlotImages(parsed.t1PlotImages);
      initialT1PlotImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t1PlotImages),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<ImageFile[]> => {
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
    (currentImages: ImageFile[] = t1PlotImages): string[] => {
      const initialUrls = collectPermanentUrls(initialT1PlotImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t1PlotImages],
  );

  const commitSavedImages = useCallback((savedImages: ImageFile[] = t1PlotImages) => {
    initialT1PlotImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t1PlotImages]);

  const collectPayload = useCallback((cleanImages: ImageFile[] = t1PlotImages) => {
    return {
      t1ProductAdvice,
      t1SalesOpportunity,
      t1DiscussionResult,
      t1Detail,
      t1NextAction,
      t1NextMeetingDate,
      t1FarmerHomeAddress,
      t1PlotLatitude,
      t1PlotLongitude,
      t1PlotImages: cleanImages,
    };
  }, [
    t1ProductAdvice,
    t1SalesOpportunity,
    t1DiscussionResult,
    t1Detail,
    t1NextAction,
    t1NextMeetingDate,
    t1FarmerHomeAddress,
    t1PlotLatitude,
    t1PlotLongitude,
    t1PlotImages,
  ]);

  return {
    t1ProductAdvice,
    setT1ProductAdvice,
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
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
