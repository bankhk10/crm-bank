"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType9Actual() {
  const [t9Formats, setT9Formats] = useState<string[]>([]);
  const [t9ActualSales, setT9ActualSales] = useState("");
  const [t9ProductSalesDetails, setT9ProductSalesDetails] = useState<any[]>([]);
  const [t9ActualAttendees, setT9ActualAttendees] = useState("");
  const [t9Images, setT9Images] = useState<ImageFile[]>([]);
  const initialT9ImagesRef = useRef<ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t9ActualSales) setT9ActualSales(parsed.t9ActualSales);
    if (parsed.t9ProductSalesDetails) {
      setT9ProductSalesDetails(parsed.t9ProductSalesDetails);
    }
    if (parsed.t9ActualAttendees) {
      setT9ActualAttendees(parsed.t9ActualAttendees);
    }
    if (parsed.t9Images && parsed.t9Images.length > 0) {
      setT9Images(parsed.t9Images);
      initialT9ImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t9Images),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<ImageFile[]> => {
      let cleanImages = t9Images;
      if (t9Images && t9Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t9Images,
          "store",
          "general",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT9Images(cleanImages);
      }
      return cleanImages;
    },
    [t9Images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: ImageFile[] = t9Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT9ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t9Images],
  );

  const commitSavedImages = useCallback((savedImages: ImageFile[] = t9Images) => {
    initialT9ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t9Images]);

  const collectPayload = useCallback(
    (cleanImages: ImageFile[] = t9Images) => {
      return {
        t9ActualSales,
        t9ProductSalesDetails,
        t9ActualAttendees,
        t9Images: cleanImages,
      };
    },
    [t9ActualSales, t9ProductSalesDetails, t9ActualAttendees, t9Images],
  );

  return {
    t9Formats,
    setT9Formats,
    t9ActualSales,
    setT9ActualSales,
    t9ProductSalesDetails,
    setT9ProductSalesDetails,
    t9ActualAttendees,
    setT9ActualAttendees,
    t9Images,
    setT9Images,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
