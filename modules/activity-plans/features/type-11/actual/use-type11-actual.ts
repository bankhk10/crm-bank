"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType11Actual() {
  const [t11StockItems, setT11StockItems] = useState<any[]>([]);
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11RemainingQty, setT11RemainingQty] = useState("");
  const [t11Remarks, setT11Remarks] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<
    "ใกล้หมด" | "ขาดสต็อก" | ""
  >("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<
    "สูง" | "ต่ำ" | "ยังไม่แน่ใจ" | ""
  >("");
  const [t11NextAction, setT11NextAction] = useState("");
  const [t11Images, setT11Images] = useState<ImageFile[]>([]);
  const initialT11ImagesRef = useRef<ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t11StockItems) setT11StockItems(parsed.t11StockItems);
    if (parsed.t11ProductList) setT11ProductList(parsed.t11ProductList);
    if (parsed.t11RemainingQty) {
      setT11RemainingQty(parsed.t11RemainingQty);
    }
    if (parsed.t11Remarks) setT11Remarks(parsed.t11Remarks);
    if (parsed.t11StockStatus) {
      const st = parsed.t11StockStatus;
      if (st === "ใกล้หมด") setT11StockStatus("ใกล้หมด");
      else if (st === "สินค้าขาดสต็อก") setT11StockStatus("ขาดสต็อก");
    }
    if (parsed.t11ReorderOpportunity) {
      const ro = parsed.t11ReorderOpportunity;
      if (ro === "สูง" || ro === "ต่ำ" || ro === "ยังไม่แน่ใจ") {
        setT11ReorderOpportunity(ro);
      }
    }
    if (parsed.t11NextAction) {
      setT11NextAction(parsed.t11NextAction);
    } else if (parsed.nextAction) {
      setT11NextAction(parsed.nextAction);
    }
    if (parsed.t11Images && parsed.t11Images.length > 0) {
      setT11Images(parsed.t11Images);
      initialT11ImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t11Images),
      );
    }
  }, []);

  const validate = useCallback((): string | null => {
    if (t11StockItems && t11StockItems.length > 0) {
      for (const item of t11StockItems) {
        if (!item.remainingQty || String(item.remainingQty).trim() === "") {
          return `กรุณาระบุจำนวนคงเหลือสำหรับสินค้า "${item.productName || "ที่ตรวจเช็ก"}"`;
        }
        if (!item.reorderOpportunity || !String(item.reorderOpportunity).trim()) {
          return `กรุณาเลือกโอกาสการสั่งซื้อรอบใหม่สำหรับสินค้า "${item.productName || "ที่ตรวจเช็ก"}"`;
        }
      }
    }
    return null;
  }, [t11StockItems]);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<ImageFile[]> => {
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
    (currentImages: ImageFile[] = t11Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT11ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t11Images],
  );

  const commitSavedImages = useCallback((savedImages: ImageFile[] = t11Images) => {
    initialT11ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t11Images]);

  const collectPayload = useCallback(
    (cleanImages: ImageFile[] = t11Images) => {
      return {
        t11StockItems,
        t11ProductList,
        t11RemainingQty,
        t11Remarks,
        t11StockStatus,
        t11ReorderOpportunity,
        t11NextAction,
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
      t11Images,
    ],
  );

  return {
    t11StockItems,
    setT11StockItems,
    t11ProductList,
    setT11ProductList,
    t11RemainingQty,
    setT11RemainingQty,
    t11Remarks,
    setT11Remarks,
    t11StockStatus,
    setT11StockStatus,
    t11ReorderOpportunity,
    setT11ReorderOpportunity,
    t11NextAction,
    setT11NextAction,
    t11Images,
    setT11Images,
    hydrate,
    validate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
