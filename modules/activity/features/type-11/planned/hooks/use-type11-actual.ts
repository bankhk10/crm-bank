"use client";

import { useState, useRef, useCallback } from "react";
import type {
  Type11StockItem,
  Type11ImageFile,
  StockStatus,
  ReorderOpportunity,
} from "../../shared/types";
import type { Type11ActualRecord } from "../types/actual.types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/application/media/image-uploader";
import { validateType11Actual } from "../application/actual-validation";
import { parseType11ActualResult } from "../application/actual-mapper";

export { validateType11Actual };

export function useType11Actual() {
  const [t11StockItems, setT11StockItems] = useState<Type11StockItem[]>([]);
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11RemainingQty, setT11RemainingQty] = useState("");
  const [t11Remarks, setT11Remarks] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<StockStatus | "">("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<ReorderOpportunity | "">("");
  const [t11NextAction, setT11NextAction] = useState("");
  const [t11Summary, setT11Summary] = useState("");
  const [t11Feedback, setT11Feedback] = useState("");
  const [t11Images, setT11Images] = useState<Type11ImageFile[]>([]);
  const initialT11ImagesRef = useRef<Type11ImageFile[]>([]);

  const commitSavedImages = useCallback((savedImages: Type11ImageFile[] = t11Images) => {
    initialT11ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t11Images]);

  const hydrate = useCallback((parsed: any, attachments?: any[]) => {
    if (!parsed) return;

    // Self-healing: if parsed does not already contain parsed t11StockItems, parse it
    const actualData =
      parsed.t11StockItems || parsed.type11Actual?.t11StockItems
        ? parsed.type11Actual || parsed
        : parseType11ActualResult(parsed, parsed.activityPlan);

    const items =
      actualData.t11StockItems ??
      actualData.stockItems ??
      actualData.stockResults ??
      parsed.t11StockItems ??
      parsed.stockResults;
    if (items && Array.isArray(items) && items.length > 0) {
      setT11StockItems(items);
    }

    if (actualData.t11ProductList || parsed.t11ProductList) {
      setT11ProductList(actualData.t11ProductList || parsed.t11ProductList);
    }
    if (actualData.t11RemainingQty || parsed.t11RemainingQty) {
      setT11RemainingQty(actualData.t11RemainingQty || parsed.t11RemainingQty);
    }
    if (actualData.t11Remarks || parsed.t11Remarks) {
      setT11Remarks(actualData.t11Remarks || parsed.t11Remarks);
    }

    const st = actualData.t11StockStatus || parsed.t11StockStatus;
    if (st) {
      setT11StockStatus(st as StockStatus);
    }

    const ro = actualData.t11ReorderOpportunity || parsed.t11ReorderOpportunity;
    if (ro) {
      setT11ReorderOpportunity(ro as ReorderOpportunity);
    }

    const nextAct =
      actualData.t11NextAction ||
      actualData.nextAction ||
      parsed.t11NextAction ||
      parsed.nextAction;
    if (nextAct) {
      setT11NextAction(nextAct);
    }

    const sum =
      actualData.t11Summary ||
      actualData.summary ||
      parsed.t11Summary ||
      parsed.summary;
    if (sum) {
      setT11Summary(sum);
    }

    const fb =
      actualData.t11Feedback ||
      actualData.feedback ||
      parsed.t11Feedback ||
      parsed.feedback;
    if (fb) {
      setT11Feedback(fb);
    }

    const imgs =
      actualData.t11Images ||
      actualData.images ||
      parsed.t11Images ||
      parsed.images;
    if (imgs && Array.isArray(imgs) && imgs.length > 0) {
      setT11Images(imgs);
      commitSavedImages(imgs);
    } else if (attachments && Array.isArray(attachments)) {
      const stockImgs = attachments
        .filter(
          (att: any) =>
            att.workTypeCode === "TYPE_11" ||
            att.category === "stock" ||
            att.category === "STOCK",
        )
        .map((att: any) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
          size: att.fileSize,
          type: att.fileType || "image/jpeg",
        }));
      if (stockImgs.length > 0) {
        setT11Images(stockImgs);
        commitSavedImages(stockImgs);
      }
    }
  }, [commitSavedImages]);

  const validate = useCallback((): string | null => {
    const res = validateType11Actual(t11StockItems);
    return res.isValid ? null : (res.error || "ข้อมูลสต็อกไม่ถูกต้อง");
  }, [t11StockItems]);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<Type11ImageFile[]> => {
      let cleanImages = t11Images;
      if (t11Images && t11Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t11Images,
          "stock",
          "general",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT11Images(cleanImages);
      }
      return cleanImages;
    },
    [t11Images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: Type11ImageFile[] = t11Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT11ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t11Images],
  );

  const collectPayload = useCallback(
    (cleanImages: Type11ImageFile[] = t11Images): Type11ActualRecord => {
      return {
        t11StockItems,
        t11ProductList,
        t11RemainingQty,
        t11Remarks,
        t11StockStatus,
        t11ReorderOpportunity,
        t11NextAction,
        t11Summary,
        t11Feedback,
        t11Images: cleanImages,
      };
    },
    [
      t11StockItems,
      t11ProductList,
      t11RemainingQty,
      t11Remarks,
      t11StockStatus,
      t11ReorderOpportunity,
      t11NextAction,
      t11Summary,
      t11Feedback,
      t11Images,
    ],
  );

  return {
    t11StockItems,
    setT11StockItems,
    stockItems: t11StockItems,
    setStockItems: setT11StockItems,
    t11ProductList,
    setT11ProductList,
    productList: t11ProductList,
    setProductList: setT11ProductList,
    t11RemainingQty,
    setT11RemainingQty,
    remainingQty: t11RemainingQty,
    setRemainingQty: setT11RemainingQty,
    t11Remarks,
    setT11Remarks,
    remarks: t11Remarks,
    setRemarks: setT11Remarks,
    t11StockStatus,
    setT11StockStatus,
    stockStatus: t11StockStatus,
    setStockStatus: setT11StockStatus,
    t11ReorderOpportunity,
    setT11ReorderOpportunity,
    reorderOpportunity: t11ReorderOpportunity,
    setReorderOpportunity: setT11ReorderOpportunity,
    t11NextAction,
    setT11NextAction,
    nextAction: t11NextAction,
    setNextAction: setT11NextAction,
    t11Summary,
    setT11Summary,
    summary: t11Summary,
    setSummary: setT11Summary,
    t11Feedback,
    setT11Feedback,
    feedback: t11Feedback,
    setFeedback: setT11Feedback,
    t11Images,
    setT11Images,
    images: t11Images,
    setImages: setT11Images,
    hydrate,
    validate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
