"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType10Actual() {
  const [t10ActualAttendees, setT10ActualAttendees] = useState("");
  const [t10ActualSalesOrBooking, setT10ActualSalesOrBooking] = useState("");
  const [t10TargetFarmersList, setT10TargetFarmersList] = useState("");
  const [t10FarmerFeedback, setT10FarmerFeedback] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t10Images, setT10Images] = useState<ImageFile[]>([]);
  const initialT10ImagesRef = useRef<ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t10ActualAttendees) {
      setT10ActualAttendees(parsed.t10ActualAttendees);
    }
    if (parsed.t10ActualSalesOrBooking) {
      setT10ActualSalesOrBooking(parsed.t10ActualSalesOrBooking);
    }
    if (parsed.t10FarmerFeedback) {
      const fb = parsed.t10FarmerFeedback;
      if (fb === "สูง" || fb === "น้อย") {
        setT10FarmerFeedback(fb === "น้อย" ? "ต่ำ" : fb);
      } else if (fb === "ปานกลาง") {
        setT10FarmerFeedback("กลาง");
      }
    }
    if (parsed.t10TargetFarmersList) {
      setT10TargetFarmersList(parsed.t10TargetFarmersList);
    }
    if (parsed.t10Images && parsed.t10Images.length > 0) {
      setT10Images(parsed.t10Images);
      initialT10ImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t10Images),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<ImageFile[]> => {
      let cleanImages = t10Images;
      if (t10Images && t10Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t10Images,
          "field-day",
          "general",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT10Images(cleanImages);
      }
      return cleanImages;
    },
    [t10Images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: ImageFile[] = t10Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT10ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t10Images],
  );

  const commitSavedImages = useCallback((savedImages: ImageFile[] = t10Images) => {
    initialT10ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t10Images]);

  const collectPayload = useCallback(
    (cleanImages: ImageFile[] = t10Images) => {
      return {
        t10ActualAttendees,
        t10ActualSalesOrBooking,
        t10FarmerFeedback,
        t10TargetFarmersList,
        t10Images: cleanImages,
      };
    },
    [
      t10ActualAttendees,
      t10ActualSalesOrBooking,
      t10FarmerFeedback,
      t10TargetFarmersList,
      t10Images,
    ],
  );

  return {
    t10ActualAttendees,
    setT10ActualAttendees,
    t10ActualSalesOrBooking,
    setT10ActualSalesOrBooking,
    t10TargetFarmersList,
    setT10TargetFarmersList,
    t10FarmerFeedback,
    setT10FarmerFeedback,
    t10Images,
    setT10Images,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
