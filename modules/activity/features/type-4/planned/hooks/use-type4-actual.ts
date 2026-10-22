"use client";

import { useState, useCallback } from "react";
import type { Type4ImageFile } from "../../shared/types";
import type { TargetCollectCompanyItem } from "../types/planned.types";
import { validateType4Actual } from "../application/actual-validation";
import { uploadActivityPlanImageGroup } from "@/modules/activity/application/media/image-uploader";

export function useType4Actual() {
  const [t4OrderNo, setT4OrderNo] = useState("");
  const [t4ReceivedAmount, setT4ReceivedAmount] = useState("");
  const [t4BillingStatus, setT4BillingStatus] = useState("");
  const [t4BillingDetail, setT4BillingDetail] = useState("");
  const [t4CollectDetail, setT4CollectDetail] = useState("");
  const [t4Detail, setT4Detail] = useState("");
  const [t4Items, setT4Items] = useState<TargetCollectCompanyItem[]>([]);
  const [t4PaymentImages, setT4PaymentImages] = useState<Type4ImageFile[]>([]);

  const handleUploadImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | File[]) => {
      let files: File[] = [];
      if (Array.isArray(e)) {
        files = e;
      } else if (e?.target?.files) {
        files = Array.from(e.target.files);
      }
      if (files.length === 0) return;

      const newImgs: Type4ImageFile[] = files.map((file) => ({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        url: URL.createObjectURL(file),
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setT4PaymentImages((prev) => [...prev, ...newImgs]);
      if (!Array.isArray(e) && e.target) {
        e.target.value = "";
      }
    },
    [],
  );

  const handleRemoveImage = useCallback((id: string) => {
    setT4PaymentImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[] = [],
    ): Promise<Type4ImageFile[]> => {
      let cleanImages = t4PaymentImages;
      if (t4PaymentImages && t4PaymentImages.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t4PaymentImages as any,
          "type4",
          "payment",
        );
        cleanImages = res.updatedImages as Type4ImageFile[];
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT4PaymentImages(cleanImages);
      }
      return cleanImages;
    },
    [t4PaymentImages],
  );

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t4OrderNo) setT4OrderNo(parsed.t4OrderNo);
    if (parsed.t4ReceivedAmount) {
      setT4ReceivedAmount(parsed.t4ReceivedAmount);
    }
    if (parsed.t4BillingStatus) {
      setT4BillingStatus(parsed.t4BillingStatus);
    }
    if (parsed.t4BillingDetail !== undefined) {
      setT4BillingDetail(parsed.t4BillingDetail);
    } else if (parsed.t4Detail && parsed.t4BillingStatus) {
      setT4BillingDetail(parsed.t4Detail);
    }

    if (parsed.t4CollectDetail !== undefined) {
      setT4CollectDetail(parsed.t4CollectDetail);
    } else if (parsed.t4Detail && !parsed.t4BillingStatus) {
      setT4CollectDetail(parsed.t4Detail);
    }

    if (parsed.t4Detail) {
      setT4Detail(parsed.t4Detail);
    }

    if (parsed.t4Items && Array.isArray(parsed.t4Items)) {
      setT4Items(parsed.t4Items);
    }

    if (parsed.t4PaymentImages && Array.isArray(parsed.t4PaymentImages)) {
      setT4PaymentImages(parsed.t4PaymentImages);
    } else if (parsed.t4Images && Array.isArray(parsed.t4Images)) {
      setT4PaymentImages(parsed.t4Images);
    }
  }, []);

  const collectPayload = useCallback(() => {
    return {
      t4OrderNo,
      t4ReceivedAmount,
      t4BillingStatus,
      t4BillingDetail,
      t4CollectDetail,
      t4Detail: t4CollectDetail || t4BillingDetail || t4Detail,
      t4Items,
      items: t4Items,
      companyItems: t4Items,
      t4PaymentImages,
    };
  }, [
    t4OrderNo,
    t4ReceivedAmount,
    t4BillingStatus,
    t4BillingDetail,
    t4CollectDetail,
    t4Detail,
    t4Items,
    t4PaymentImages,
  ]);

  const validate = useCallback(
    (collectType?: "BILLING" | "COLLECT") => {
      return validateType4Actual(
        {
          orderNo: t4OrderNo,
          receivedAmount: t4ReceivedAmount,
          billingStatus: t4BillingStatus,
          billingDetail: t4BillingDetail,
          collectDetail: t4CollectDetail,
          notes: t4Detail,
        },
        collectType,
      );
    },
    [
      t4OrderNo,
      t4ReceivedAmount,
      t4BillingStatus,
      t4BillingDetail,
      t4CollectDetail,
      t4Detail,
    ],
  );

  return {
    t4OrderNo,
    setT4OrderNo,
    t4ReceivedAmount,
    setT4ReceivedAmount,
    t4BillingStatus,
    setT4BillingStatus,
    t4BillingDetail,
    setT4BillingDetail,
    t4CollectDetail,
    setT4CollectDetail,
    t4Detail,
    setT4Detail,
    t4Items,
    setT4Items,
    t4PaymentImages,
    setT4PaymentImages,
    handleUploadImages,
    handleRemoveImage,
    uploadImages,
    hydrate,
    collectPayload,
    validate,
  };
}
