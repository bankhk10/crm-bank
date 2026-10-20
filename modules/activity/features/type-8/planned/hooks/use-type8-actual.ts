"use client";

import { useState, useRef, useCallback } from "react";
import type { Type8ImageFile, ProductSaleDetail } from "../../shared/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/application/media/image-uploader";
import { validateType8Actual } from "../application/actual-validation";

export { validateType8Actual };

export function useType8Actual() {
  const [t8ActualAttendees, setT8ActualAttendees] = useState("");
  const [t8FeedbackQnA, setT8FeedbackQnA] = useState("");
  const [t8ProductSalesDetails, setT8ProductSalesDetails] = useState<ProductSaleDetail[]>([]);
  const [t8Images, setT8Images] = useState<Type8ImageFile[]>([]);
  const initialT8ImagesRef = useRef<Type8ImageFile[]>([]);
  const [t8RegistrationImages, setT8RegistrationImages] = useState<Type8ImageFile[]>([]);
  const initialT8RegistrationImagesRef = useRef<Type8ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    const actualData = parsed.type8Actual || parsed;
    const attendees =
      actualData.actualAttendees ??
      actualData.t8ActualAttendees ??
      parsed.actualAttendees ??
      parsed.t8ActualAttendees;
    if (attendees != null && attendees !== "") {
      setT8ActualAttendees(String(attendees));
    }

    const feedback =
      actualData.feedbackQnA ??
      actualData.t8FeedbackQnA ??
      parsed.feedbackQnA ??
      parsed.t8FeedbackQnA;
    if (feedback) setT8FeedbackQnA(feedback);

    const salesDetails =
      actualData.productSalesDetails ??
      actualData.t8ProductSalesDetails ??
      parsed.productSalesDetails ??
      parsed.t8ProductSalesDetails;
    if (salesDetails) {
      setT8ProductSalesDetails(salesDetails);
    }

    const imgs =
      actualData.images ??
      actualData.t8Images ??
      parsed.images ??
      parsed.t8Images;
    if (imgs && imgs.length > 0) {
      setT8Images(imgs);
      initialT8ImagesRef.current = JSON.parse(JSON.stringify(imgs));
    }

    const regImgs =
      actualData.registrationImages ??
      actualData.t8RegistrationImages ??
      parsed.registrationImages ??
      parsed.t8RegistrationImages;
    if (regImgs && regImgs.length > 0) {
      setT8RegistrationImages(regImgs);
      initialT8RegistrationImagesRef.current = JSON.parse(
        JSON.stringify(regImgs),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
    ): Promise<{
      cleanImages: Type8ImageFile[];
      cleanRegistrationImages: Type8ImageFile[];
    }> => {
      let cleanImages = t8Images;
      if (t8Images && t8Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t8Images,
          "meeting",
          "meeting",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT8Images(cleanImages);
      }

      let cleanRegImages = t8RegistrationImages;
      if (t8RegistrationImages && t8RegistrationImages.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t8RegistrationImages,
          "registration",
          "registration",
        );
        cleanRegImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT8RegistrationImages(cleanRegImages);
      }

      return {
        cleanImages,
        cleanRegistrationImages: cleanRegImages,
      };
    },
    [t8Images, t8RegistrationImages],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (
      currentImages: Type8ImageFile[] = t8Images,
      currentRegImages: Type8ImageFile[] = t8RegistrationImages,
    ): string[] => {
      const initialMeetingUrls = collectPermanentUrls(
        initialT8ImagesRef.current,
      );
      const currentMeetingUrls = new Set(collectPermanentUrls(currentImages));
      const deletedMeetingUrls = initialMeetingUrls.filter(
        (u) => !currentMeetingUrls.has(u),
      );

      const initialRegUrls = collectPermanentUrls(
        initialT8RegistrationImagesRef.current,
      );
      const currentRegUrls = new Set(collectPermanentUrls(currentRegImages));
      const deletedRegUrls = initialRegUrls.filter(
        (u) => !currentRegUrls.has(u),
      );

      return [...deletedMeetingUrls, ...deletedRegUrls];
    },
    [t8Images, t8RegistrationImages],
  );

  const commitSavedImages = useCallback(
    (
      savedImages: Type8ImageFile[] = t8Images,
      savedRegImages: Type8ImageFile[] = t8RegistrationImages,
    ) => {
      initialT8ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
      initialT8RegistrationImagesRef.current = JSON.parse(
        JSON.stringify(savedRegImages),
      );
    },
    [t8Images, t8RegistrationImages],
  );

  const collectPayload = useCallback(
    (
      arg1?:
        | {
            isTypeVisible?: boolean;
            cleanImages?: Type8ImageFile[];
            cleanRegistrationImages?: Type8ImageFile[];
          }
        | Type8ImageFile[],
      arg2?: Type8ImageFile[],
    ) => {
      let cleanImages: Type8ImageFile[] = t8Images;
      let cleanRegImages: Type8ImageFile[] = t8RegistrationImages;

      if (Array.isArray(arg1)) {
        cleanImages = arg1;
        if (arg2) cleanRegImages = arg2;
      } else if (arg1 && typeof arg1 === "object") {
        if (arg1.cleanImages) cleanImages = arg1.cleanImages;
        if (arg1.cleanRegistrationImages)
          cleanRegImages = arg1.cleanRegistrationImages;
      }

      const actualData = {
        t8ActualAttendees,
        t8FeedbackQnA,
        t8ProductSalesDetails,
        t8Images: cleanImages,
        t8RegistrationImages: cleanRegImages,
      };

      return {
        ...actualData,
        type8Actual: actualData,
      };
    },
    [
      t8ActualAttendees,
      t8FeedbackQnA,
      t8ProductSalesDetails,
      t8Images,
      t8RegistrationImages,
    ],
  );

  const validate = useCallback(
    (activityResultStatus: string = "COMPLETED"): string | null => {
      const res = validateType8Actual({
        activityResultStatus,
        t8RegistrationImages,
      });
      return res.isValid ? null : (res.error || "ข้อมูลการประชุมไม่ถูกต้อง");
    },
    [t8RegistrationImages],
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
    t8RegistrationImages,
    setT8RegistrationImages,
    // Aliases without prefix for UI components
    actualAttendees: t8ActualAttendees,
    setActualAttendees: setT8ActualAttendees,
    feedbackQnA: t8FeedbackQnA,
    setFeedbackQnA: setT8FeedbackQnA,
    productSalesDetails: t8ProductSalesDetails,
    setProductSalesDetails: setT8ProductSalesDetails,
    images: t8Images,
    setImages: setT8Images,
    registrationImages: t8RegistrationImages,
    setRegistrationImages: setT8RegistrationImages,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
    validate,
  };
}
