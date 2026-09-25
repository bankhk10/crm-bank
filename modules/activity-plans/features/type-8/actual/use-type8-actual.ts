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
  const [t8RegistrationImages, setT8RegistrationImages] = useState<ImageFile[]>(
    [],
  );
  const initialT8RegistrationImagesRef = useRef<ImageFile[]>([]);

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
    if (parsed.t8RegistrationImages && parsed.t8RegistrationImages.length > 0) {
      setT8RegistrationImages(parsed.t8RegistrationImages);
      initialT8RegistrationImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t8RegistrationImages),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
    ): Promise<{
      cleanImages: ImageFile[];
      cleanRegistrationImages: ImageFile[];
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
      currentImages: ImageFile[] = t8Images,
      currentRegImages: ImageFile[] = t8RegistrationImages,
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
      savedImages: ImageFile[] = t8Images,
      savedRegImages: ImageFile[] = t8RegistrationImages,
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
      cleanImages: ImageFile[] = t8Images,
      cleanRegImages: ImageFile[] = t8RegistrationImages,
    ) => {
      return {
        t8ActualAttendees,
        t8FeedbackQnA,
        t8ProductSalesDetails,
        t8Images: cleanImages,
        t8RegistrationImages: cleanRegImages,
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
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
