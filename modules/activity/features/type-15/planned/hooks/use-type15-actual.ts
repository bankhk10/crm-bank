"use client";

import { useState, useCallback } from "react";
import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type {
  UseType15ActualOptions,
  UseType15ActualResult,
} from "../types/actual.types";
import {
  mapType15ActualInitialData,
  mapType15ActualToPayload,
} from "../application/actual-mapper";
import { validateType15Actual } from "../application/actual-validation";

export function useType15Actual({
  initial,
}: UseType15ActualOptions = {}): UseType15ActualResult {
  const initialData = mapType15ActualInitialData(initial);

  const [detail, setDetail] = useState<string>(initialData.detail || "");
  const [images, setImages] = useState<ImageFile[]>(initialData.images || []);

  const validateActual = useCallback(() => {
    return validateType15Actual({ detail, images });
  }, [detail, images]);

  const mapActualPayload = useCallback(() => {
    return mapType15ActualToPayload({ detail, images });
  }, [detail, images]);

  const hydrate = useCallback((resultData: any, attachmentsData?: any[]) => {
    if (!resultData) return;
    const initialMapped = mapType15ActualInitialData({
      ...resultData,
      attachments: attachmentsData || resultData.attachments,
    });
    if (initialMapped.detail) setDetail(initialMapped.detail);
    if (initialMapped.images?.length) setImages(initialMapped.images);
  }, []);

  return {
    detail,
    setDetail,
    images,
    setImages,
    validateActual,
    mapActualPayload,
    hydrate,
  };
}
