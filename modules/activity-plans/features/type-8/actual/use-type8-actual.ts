"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType8Actual() {
  const [t8ActualAttendees, setT8ActualAttendees] = useState("");
  const [t8FeedbackQnA, setT8FeedbackQnA] = useState("");
  const [t8ProductSalesDetails, setT8ProductSalesDetails] = useState<any[]>([]);
  const [t8Images, setT8Images] = useState<ImageFile[]>([]);
  const initialT8ImagesRef = useRef<ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t8ActualAttendees) {
      setT8ActualAttendees(parsed.t8ActualAttendees);
    }
    if (parsed.t8FeedbackQnA) setT8FeedbackQnA(parsed.t8FeedbackQnA);
    if (parsed.t8ProductSalesDetails) {
      setT8ProductSalesDetails(parsed.t8ProductSalesDetails);
    }
    if (parsed.t8Images && parsed.t8Images.length > 0) {
      setT8Images(parsed.t8Images);
      initialT8ImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t8Images),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<ImageFile[]> => {
      let cleanImages = t8Images;
      if (t8Images && t8Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t8Images,
          "meeting",
          "general",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT8Images(cleanImages);
      }
      return cleanImages;
    },
    [t8Images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: ImageFile[] = t8Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT8ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t8Images],
  );

  const commitSavedImages = useCallback((savedImages: ImageFile[] = t8Images) => {
    initialT8ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t8Images]);

  const collectPayload = useCallback(
    (cleanImages: ImageFile[] = t8Images) => {
      return {
        t8ActualAttendees,
        t8FeedbackQnA,
        t8ProductSalesDetails,
        t8Images: cleanImages,
      };
    },
    [t8ActualAttendees, t8FeedbackQnA, t8ProductSalesDetails, t8Images],
  );

  return {
    t8ActualAttendees,
    setT8ActualAttendees,
    t8FeedbackQnA,
    setT8FeedbackQnA,
    t8ProductSalesDetails,
    setT8ProductSalesDetails,
    t8Images,
    setT8Images,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
