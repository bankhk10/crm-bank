"use client";

import { useState, useRef, useCallback } from "react";
import type {
  Type10ImageFile,
  Type10SoldProductItem,
  FarmerFeedback,
} from "../../shared/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/application/media/image-uploader";
import { validateType10Actual } from "../application/actual-validation";

export { validateType10Actual };

export function useType10Actual() {
  const [actualAttendees, setActualAttendees] = useState("");
  const [actualSalesOrBooking, setActualSalesOrBooking] = useState("");
  const [farmerFeedback, setFarmerFeedback] = useState<FarmerFeedback | "">("");
  const [hasSales, setHasSales] = useState(false);
  const [soldProducts, setSoldProducts] = useState<Type10SoldProductItem[]>([]);
  const [images, setImages] = useState<Type10ImageFile[]>([]);
  const initialImagesRef = useRef<Type10ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    const actualData = parsed.type10Actual || parsed;

    const attendees =
      actualData.actualAttendees ??
      actualData.t10ActualAttendees ??
      actualData.actualAttendeesCount ??
      parsed.actualAttendees ??
      parsed.actualAttendeesCount;
    if (attendees != null && attendees !== "") {
      setActualAttendees(String(attendees));
    }

    const sales =
      actualData.actualSalesOrBooking ??
      actualData.t10ActualSalesOrBooking ??
      actualData.salesResultAmount ??
      actualData.salesResult ??
      parsed.actualSalesOrBooking ??
      parsed.salesResultAmount;
    if (sales != null && sales !== "") {
      setActualSalesOrBooking(String(sales));
    }

    const feedback = actualData.farmerFeedback ?? parsed.farmerFeedback;
    if (feedback) setFarmerFeedback(feedback);

    const prods =
      actualData.soldProducts ??
      actualData.productSalesDetails ??
      parsed.soldProducts ??
      parsed.productSalesDetails;
    if (prods && Array.isArray(prods) && prods.length > 0) {
      setSoldProducts(prods);
      setHasSales(true);
    }

    const imgs =
      actualData.images ??
      actualData.t10Images ??
      parsed.images ??
      parsed.t10Images;
    if (imgs && Array.isArray(imgs) && imgs.length > 0) {
      setImages(imgs);
      initialImagesRef.current = JSON.parse(JSON.stringify(imgs));
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<Type10ImageFile[]> => {
      let cleanImages = images;
      if (images && images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          images,
          "type10",
          "atmosphere",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setImages(cleanImages);
      }
      return cleanImages;
    },
    [images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: Type10ImageFile[] = images): string[] => {
      const initialUrls = collectPermanentUrls(initialImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [images],
  );

  const commitSavedImages = useCallback((savedImages: Type10ImageFile[] = images) => {
    initialImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [images]);

  const collectPayload = useCallback(
    (cleanImages: Type10ImageFile[] = images) => {
      return {
        t10ActualAttendees: actualAttendees,
        t10ActualSalesOrBooking: actualSalesOrBooking,
        t10FarmerFeedback: farmerFeedback,
        t10SoldProducts: soldProducts,
        t10Images: cleanImages,
        type10Actual: {
          actualAttendees,
          actualSalesOrBooking,
          farmerFeedback,
          soldProducts,
          images: cleanImages,
        },
      };
    },
    [actualAttendees, actualSalesOrBooking, farmerFeedback, soldProducts, images],
  );

  return {
    actualAttendees,
    setActualAttendees,
    t10ActualAttendees: actualAttendees,
    actualSalesOrBooking,
    setActualSalesOrBooking,
    t10ActualSalesOrBooking: actualSalesOrBooking,
    farmerFeedback,
    setFarmerFeedback,
    t10FarmerFeedback: farmerFeedback,
    hasSales,
    setHasSales,
    soldProducts,
    setSoldProducts,
    productSalesDetails: soldProducts,
    images,
    setImages,
    t10Images: images,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
