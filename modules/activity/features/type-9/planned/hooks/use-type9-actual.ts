"use client";

import { useState, useRef, useCallback } from "react";
import type { Type9ImageFile, Type9ProductSaleDetail } from "../../shared/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/application/media/image-uploader";
import { validateType9Actual } from "../application/actual-validation";

export { validateType9Actual };

export function useType9Actual() {
  const [t9Formats, setT9Formats] = useState<string[]>([]);
  const [t9ActualSales, setT9ActualSales] = useState("");
  const [t9ProductSalesDetails, setT9ProductSalesDetails] = useState<Type9ProductSaleDetail[]>([]);
  const [t9ActualAttendees, setT9ActualAttendees] = useState("");
  const [t9Images, setT9Images] = useState<Type9ImageFile[]>([]);
  const initialT9ImagesRef = useRef<Type9ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    const actualData = parsed.type9Actual || parsed;

    const sales =
      actualData.actualSales ??
      actualData.t9ActualSales ??
      parsed.actualSales ??
      parsed.t9ActualSales;
    if (sales != null && sales !== "") setT9ActualSales(String(sales));

    const salesDetails =
      actualData.productSalesDetails ??
      actualData.t9ProductSalesDetails ??
      parsed.productSalesDetails ??
      parsed.t9ProductSalesDetails;
    if (salesDetails && Array.isArray(salesDetails)) {
      setT9ProductSalesDetails(salesDetails);
    }

    const attendees =
      actualData.actualAttendees ??
      actualData.t9ActualAttendees ??
      parsed.actualAttendees ??
      parsed.t9ActualAttendees;
    if (attendees != null && attendees !== "") {
      setT9ActualAttendees(String(attendees));
    }

    const imgs =
      actualData.images ??
      actualData.t9Images ??
      parsed.images ??
      parsed.t9Images;
    if (imgs && Array.isArray(imgs) && imgs.length > 0) {
      setT9Images(imgs);
      initialT9ImagesRef.current = JSON.parse(JSON.stringify(imgs));
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<Type9ImageFile[]> => {
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
    (currentImages: Type9ImageFile[] = t9Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT9ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t9Images],
  );

  const commitSavedImages = useCallback((savedImages: Type9ImageFile[] = t9Images) => {
    initialT9ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t9Images]);

  const collectPayload = useCallback(
    (cleanImages: Type9ImageFile[] = t9Images) => {
      return {
        t9ActualSales,
        t9ProductSalesDetails,
        t9ActualAttendees,
        t9Images: cleanImages,
        type9Actual: {
          actualSales: t9ActualSales,
          productSalesDetails: t9ProductSalesDetails,
          actualAttendees: t9ActualAttendees,
          images: cleanImages,
        },
      };
    },
    [t9ActualSales, t9ProductSalesDetails, t9ActualAttendees, t9Images],
  );

  return {
    t9Formats,
    setT9Formats,
    t9ActualSales,
    setT9ActualSales,
    actualSales: t9ActualSales,
    setActualSales: setT9ActualSales,
    t9ProductSalesDetails,
    setT9ProductSalesDetails,
    productSalesDetails: t9ProductSalesDetails,
    setProductSalesDetails: setT9ProductSalesDetails,
    t9ActualAttendees,
    setT9ActualAttendees,
    actualAttendees: t9ActualAttendees,
    setActualAttendees: setT9ActualAttendees,
    t9Images,
    setT9Images,
    images: t9Images,
    setImages: setT9Images,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
