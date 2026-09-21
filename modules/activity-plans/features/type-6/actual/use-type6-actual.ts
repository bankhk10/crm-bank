"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType6Actual() {
  const [t6ProductId, setT6ProductId] = useState<string | null>(null);
  const [t6ProductName, setT6ProductName] = useState<string | null>("");
  const [t6LotNumber, setT6LotNumber] = useState<string>("");
  const [t6PurchaseChannel, setT6PurchaseChannel] = useState<
    "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | ""
  >("ร้านค้าตัวแทนจำหน่าย");
  const [t6StoreId, setT6StoreId] = useState<string | null>(null);
  const [t6StoreName, setT6StoreName] = useState<string | null>("");
  const [t6IssueType, setT6IssueType] = useState<string>(
    "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  );
  const [t6Detail, setT6Detail] = useState<string>("");
  const [t6ProblemDetail, setT6ProblemDetail] = useState("");
  const [t6InitialSolution, setT6InitialSolution] = useState("");
  const [t6Status, setT6Status] = useState<"เสร็จสิ้น" | "รอติดตาม" | "">(
    "เสร็จสิ้น",
  );
  const [t6Images, setT6Images] = useState<ImageFile[]>([]);
  const initialT6ImagesRef = useRef<ImageFile[]>([]);

  const validate = useCallback((): string | null => {
    if (!t6PurchaseChannel) {
      return "กรุณาระบุช่องทางการซื้อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน";
    }
    if (t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && !t6StoreId) {
      return "กรุณาเลือกร้านค้าตัวแทนจำหน่าย";
    }
    if (!t6ProductId) {
      return "กรุณาเลือกชื่อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน";
    }
    if (!t6LotNumber?.trim()) {
      return "กรุณาระบุเลข Lot";
    }
    if (!t6IssueType) {
      return "กรุณาเลือกประเภทปัญหา";
    }
    if (t6IssueType === "อื่นๆ ระบุ" && !t6Detail?.trim()) {
      return "กรุณาระบุรายละเอียดปัญหา";
    }
    return null;
  }, [
    t6PurchaseChannel,
    t6StoreId,
    t6ProductId,
    t6LotNumber,
    t6IssueType,
    t6Detail,
  ]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t6IssueRecord) {
      const rec = parsed.t6IssueRecord;
      if (rec.productId) setT6ProductId(rec.productId);
      if (rec.productName) setT6ProductName(rec.productName);
      if (rec.lotNumber) setT6LotNumber(rec.lotNumber);
      if (rec.purchaseChannel) {
        setT6PurchaseChannel(
          rec.purchaseChannel as "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์",
        );
      }
      if (rec.storeId) setT6StoreId(rec.storeId);
      if (rec.storeName) setT6StoreName(rec.storeName);
      if (rec.issueType) setT6IssueType(rec.issueType);
      if (rec.detail) setT6Detail(rec.detail);
      if (rec.status) {
        setT6Status(
          rec.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น",
        );
      }
      if (rec.images && rec.images.length > 0) {
        setT6Images(rec.images);
        initialT6ImagesRef.current = JSON.parse(
          JSON.stringify(rec.images),
        );
      }
    } else {
      if (parsed.t6ProblemDetail) {
        setT6ProblemDetail(parsed.t6ProblemDetail);
        setT6Detail(parsed.t6ProblemDetail);
      } else if (parsed.problemFound) {
        setT6ProblemDetail((prev) => prev || parsed.problemFound || "");
        setT6Detail((prev) => prev || parsed.problemFound || "");
      }
      if (parsed.t6InitialSolution) {
        setT6InitialSolution(parsed.t6InitialSolution);
      }
      if (parsed.t6Status) setT6Status(parsed.t6Status);
      if (parsed.t6Images && parsed.t6Images.length > 0) {
        setT6Images(parsed.t6Images);
        initialT6ImagesRef.current = JSON.parse(
          JSON.stringify(parsed.t6Images),
        );
      }
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<ImageFile[]> => {
      let cleanImages = t6Images;
      if (t6Images && t6Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t6Images.slice(0, 5),
          "issue",
          "general",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT6Images(cleanImages);
      }
      return cleanImages;
    },
    [t6Images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: ImageFile[] = t6Images): string[] => {
      const initialUrls = collectPermanentUrls(initialT6ImagesRef.current);
      const currentUrls = new Set(collectPermanentUrls(currentImages));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t6Images],
  );

  const commitSavedImages = useCallback((savedImages: ImageFile[] = t6Images) => {
    initialT6ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
  }, [t6Images]);

  const collectPayload = useCallback(
    (context: {
      isTypeVisible: boolean;
      products: any[];
      customers: any[];
      cleanImages?: ImageFile[];
    }) => {
      const cleanImgs = context.cleanImages || t6Images;
      return {
        t6IssueRecord: context.isTypeVisible
          ? {
              productId: t6ProductId || null,
              productName:
                context.products.find((p) => p.id === t6ProductId)?.name ||
                t6ProductName ||
                null,
              lotNumber: t6LotNumber?.trim() || null,
              purchaseChannel: t6PurchaseChannel,
              storeId:
                t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย"
                  ? t6StoreId || null
                  : null,
              storeName:
                t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย"
                  ? context.customers.find((c) => c.id === t6StoreId)?.name ||
                    t6StoreName ||
                    null
                  : null,
              issueType: t6IssueType,
              detail: t6Detail?.trim() || null,
              status: t6Status || "เสร็จสิ้น",
              images: cleanImgs,
            }
          : undefined,
        t6ProblemDetail,
        t6InitialSolution,
        t6Status,
        t6Images: cleanImgs,
      };
    },
    [
      t6ProductId,
      t6ProductName,
      t6LotNumber,
      t6PurchaseChannel,
      t6StoreId,
      t6StoreName,
      t6IssueType,
      t6Detail,
      t6Status,
      t6Images,
      t6ProblemDetail,
      t6InitialSolution,
    ],
  );

  return {
    t6ProductId,
    setT6ProductId,
    t6ProductName,
    setT6ProductName,
    t6LotNumber,
    setT6LotNumber,
    t6PurchaseChannel,
    setT6PurchaseChannel,
    t6StoreId,
    setT6StoreId,
    t6StoreName,
    setT6StoreName,
    t6IssueType,
    setT6IssueType,
    t6Detail,
    setT6Detail,
    t6ProblemDetail,
    setT6ProblemDetail,
    t6InitialSolution,
    setT6InitialSolution,
    t6Status,
    setT6Status,
    t6Images,
    setT6Images,
    validate,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
