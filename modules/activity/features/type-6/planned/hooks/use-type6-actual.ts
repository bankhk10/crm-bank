"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageFile } from "@/modules/activity/domain/summary/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity/application/media/image-uploader";
import { validateType6Actual } from "../application/actual-validation";
import { parseType6ActualResult } from "../application/actual-mapper";
import type { Type6IssueRecord, Type6TargetItem } from "../../shared/types";

export { validateType6Actual };

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

  // Multi-target issue details
  const [t6IssueDetails, setT6IssueDetails] = useState<Type6IssueRecord[]>([]);
  const initialT6IssueDetailsRef = useRef<Type6IssueRecord[]>([]);

  const handleUpdateT6IssueItem = useCallback(
    (index: number, updated: Partial<Type6IssueRecord>) => {
      setT6IssueDetails((prev) => {
        const next = [...prev];
        while (next.length <= index) {
          next.push({
            id: `issue-${next.length + 1}`,
            purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
            issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
            status: "เสร็จสิ้น",
            images: [],
          });
        }
        next[index] = { ...next[index], ...updated };
        return next;
      });

      // Synchronize index 0 with scalar states for backward compatibility
      if (index === 0) {
        if (updated.productId !== undefined) setT6ProductId(updated.productId ?? null);
        if (updated.productName !== undefined) setT6ProductName(updated.productName ?? null);
        if (updated.lotNumber !== undefined) setT6LotNumber(updated.lotNumber || "");
        if (updated.purchaseChannel !== undefined) {
          setT6PurchaseChannel(updated.purchaseChannel as any);
        }
        if (updated.storeId !== undefined) setT6StoreId(updated.storeId ?? null);
        if (updated.storeName !== undefined) setT6StoreName(updated.storeName ?? null);
        if (updated.issueType !== undefined) setT6IssueType(updated.issueType);
        if (updated.detail !== undefined) setT6Detail(updated.detail || "");
        if (updated.problemFound !== undefined) setT6ProblemDetail(updated.problemFound || "");
        if (updated.initialSolution !== undefined) setT6InitialSolution(updated.initialSolution || "");
        if (updated.status !== undefined) setT6Status(updated.status as any);
        if (updated.images !== undefined) setT6Images(updated.images || []);
      }
    },
    [],
  );

  const validate = useCallback((): string | null => {
    const res = validateType6Actual({
      t6PurchaseChannel,
      t6StoreId,
      t6ProductId,
      t6LotNumber,
      t6IssueType,
      t6Detail,
      items: t6IssueDetails.length > 0 ? t6IssueDetails : undefined,
    });
    return res.isValid ? null : (res.error || "ข้อมูลเรื่องร้องเรียนไม่ถูกต้อง");
  }, [
    t6PurchaseChannel,
    t6StoreId,
    t6ProductId,
    t6LotNumber,
    t6IssueType,
    t6Detail,
    t6IssueDetails,
  ]);

  const hydrate = useCallback(
    (parsedOrRaw: any, options?: { targets?: Type6TargetItem[] }) => {
      if (!parsedOrRaw) return;
      const parsed =
        parsedOrRaw.t6IssueRecord || parsedOrRaw.t6IssueDetails
          ? parsedOrRaw
          : parseType6ActualResult(parsedOrRaw);
      if (!parsed) return;

      const plannedTargets = options?.targets || [];

      // 1. If parsed has multiple issue details from DB
      if (
        parsed.t6IssueDetails &&
        Array.isArray(parsed.t6IssueDetails) &&
        parsed.t6IssueDetails.length > 0
      ) {
        // Merge with planned targets to ensure targetId and customer context are intact
        const mergedDetails: Type6IssueRecord[] = parsed.t6IssueDetails.map(
          (iss: any, idx: number) => {
            const tgt =
              plannedTargets.find((t) => t.id === iss.targetId) ||
              plannedTargets[idx];
            return {
              ...iss,
              targetId: iss.targetId || tgt?.id,
              customerName: iss.customerName || tgt?.customerName || tgt?.customer || null,
              isManualCustomer:
                iss.isManualCustomer !== undefined
                  ? iss.isManualCustomer
                  : Boolean(tgt?.isManualCustomer),
            };
          },
        );

        setT6IssueDetails(mergedDetails);
        initialT6IssueDetailsRef.current = JSON.parse(
          JSON.stringify(mergedDetails),
        );

        const first = mergedDetails[0];
        if (first) {
          if (first.productId) setT6ProductId(first.productId);
          if (first.productName) setT6ProductName(first.productName);
          if (first.lotNumber) setT6LotNumber(first.lotNumber);
          if (first.purchaseChannel) {
            setT6PurchaseChannel(
              first.purchaseChannel as "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์",
            );
          }
          if (first.storeId) setT6StoreId(first.storeId);
          if (first.storeName) setT6StoreName(first.storeName);
          if (first.issueType) setT6IssueType(first.issueType);
          if (first.detail) setT6Detail(first.detail);
          if (first.status) {
            setT6Status(
              first.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น",
            );
          }
          if (first.images && first.images.length > 0) {
            setT6Images(first.images);
            initialT6ImagesRef.current = JSON.parse(
              JSON.stringify(first.images),
            );
          }
        }
        return;
      }

      // 2. If no saved results yet, seed from planned targets
      if (plannedTargets.length > 0) {
        const initialDetails: Type6IssueRecord[] = plannedTargets.map(
          (t, idx) => ({
            id: `issue-${idx + 1}`,
            targetId: t.id,
            storeId: t.isManualCustomer ? null : t.storeId || null,
            storeName: t.isManualCustomer
              ? null
              : t.customerName || t.customer || null,
            customerName: t.customerName || t.customer || null,
            isManualCustomer: Boolean(t.isManualCustomer),
            purchaseChannel: t.storeId ? "ร้านค้าตัวแทนจำหน่าย" : "ร้านค้าตัวแทนจำหน่าย",
            productId: null,
            productName: "",
            lotNumber: "",
            issueType: t.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
            detail: t.detail || "",
            status: "เสร็จสิ้น",
            images: [],
          }),
        );
        setT6IssueDetails(initialDetails);
        initialT6IssueDetailsRef.current = JSON.parse(
          JSON.stringify(initialDetails),
        );

        if (initialDetails[0]) {
          setT6IssueType(initialDetails[0].issueType);
          setT6Detail(initialDetails[0].detail || "");
          if (initialDetails[0].storeId) setT6StoreId(initialDetails[0].storeId);
          if (initialDetails[0].storeName)
            setT6StoreName(initialDetails[0].storeName);
        }
        return;
      }

      // 3. Fallback for single issue record
      if (parsed.t6IssueRecord) {
        const rec = parsed.t6IssueRecord;
        setT6IssueDetails([rec]);
        initialT6IssueDetailsRef.current = JSON.parse(JSON.stringify([rec]));
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
    },
    [],
  );

  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
    ): Promise<ImageFile[]> => {
      const allCleanImages: ImageFile[] = [];

      if (t6IssueDetails.length > 0) {
        const updatedDetails = [...t6IssueDetails];
        for (let i = 0; i < updatedDetails.length; i++) {
          const itemImgs = updatedDetails[i].images || [];
          if (itemImgs.length > 0) {
            const res = await uploadActivityPlanImageGroup(
              planId,
              itemImgs.slice(0, 5),
              "issue",
              "general",
            );
            updatedDetails[i] = {
              ...updatedDetails[i],
              images: res.updatedImages,
            };
            newlyUploadedUrls.push(...res.newlyUploadedUrls);
            allCleanImages.push(...res.updatedImages);
          }
        }
        setT6IssueDetails(updatedDetails);
        if (updatedDetails[0]?.images) {
          setT6Images(updatedDetails[0].images);
        }
      } else if (t6Images && t6Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t6Images.slice(0, 5),
          "issue",
          "general",
        );
        cleanImagesFallback: {
          newlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT6Images(res.updatedImages);
          allCleanImages.push(...res.updatedImages);
        }
      }

      return allCleanImages.length > 0 ? allCleanImages : t6Images;
    },
    [t6IssueDetails, t6Images],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentImages: ImageFile[] = t6Images): string[] => {
      const initialList = [
        ...initialT6ImagesRef.current,
        ...initialT6IssueDetailsRef.current.flatMap((d) => d.images || []),
      ];
      const currentList = [
        ...currentImages,
        ...t6IssueDetails.flatMap((d) => d.images || []),
      ];
      const initialUrls = collectPermanentUrls(initialList as any);
      const currentUrls = new Set(collectPermanentUrls(currentList as any));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t6Images, t6IssueDetails],
  );

  const commitSavedImages = useCallback(
    (savedImages: ImageFile[] = t6Images) => {
      initialT6ImagesRef.current = JSON.parse(JSON.stringify(savedImages));
      initialT6IssueDetailsRef.current = JSON.parse(
        JSON.stringify(t6IssueDetails),
      );
    },
    [t6Images, t6IssueDetails],
  );

  const collectPayload = useCallback(
    (context: {
      isTypeVisible: boolean;
      products: any[];
      customers: any[];
      cleanImages?: ImageFile[];
    }) => {
      const cleanImgs = context.cleanImages || t6Images;

      if (!context.isTypeVisible) {
        return {
          t6ProblemDetail,
          t6InitialSolution,
          t6Status,
          t6Images: cleanImgs,
        };
      }

      if (t6IssueDetails.length > 0) {
        const mappedList: Type6IssueRecord[] = t6IssueDetails.map(
          (item, idx) => {
            const prodName =
              context.products.find((p) => p.id === item.productId)?.name ||
              item.productName ||
              null;
            const stName =
              item.purchaseChannel === "ร้านค้าตัวแทนจำหน่าย"
                ? context.customers.find((c) => c.id === item.storeId)?.name ||
                  item.storeName ||
                  null
                : null;

            return {
              id: item.id || `issue-${idx + 1}`,
              targetId: item.targetId || undefined,
              productId: item.productId || null,
              productName: prodName,
              lotNumber: item.lotNumber?.trim() || null,
              purchaseChannel: item.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
              storeId:
                item.purchaseChannel === "ร้านค้าตัวแทนจำหน่าย"
                  ? item.storeId || null
                  : null,
              storeName: stName,
              customerName: item.customerName || null,
              isManualCustomer: Boolean(item.isManualCustomer),
              issueType:
                item.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
              detail: item.detail?.trim() || null,
              status: item.status || "เสร็จสิ้น",
              images: item.images || [],
            };
          },
        );

        return {
          t6IssueDetails: mappedList,
          type6Results: mappedList,
          issueResults: mappedList,
          t6IssueRecord: mappedList[0],
          t6ProductId: mappedList[0]?.productId || null,
          t6ProductName: mappedList[0]?.productName || null,
          t6LotNumber: mappedList[0]?.lotNumber || "",
          t6PurchaseChannel:
            mappedList[0]?.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
          t6StoreId: mappedList[0]?.storeId || null,
          t6StoreName: mappedList[0]?.storeName || null,
          t6IssueType:
            mappedList[0]?.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
          t6Detail: mappedList[0]?.detail || "",
          t6Status: mappedList[0]?.status || "เสร็จสิ้น",
          t6Images: mappedList[0]?.images || cleanImgs,
          t6ProblemDetail,
          t6InitialSolution,
        };
      }

      // Single item fallback
      const singleItem = {
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
      };

      return {
        t6IssueRecord: singleItem,
        t6IssueDetails: [singleItem],
        type6Results: [singleItem],
        issueResults: [singleItem],
        t6ProductId,
        t6ProductName,
        t6LotNumber,
        t6PurchaseChannel,
        t6StoreId,
        t6StoreName,
        t6IssueType,
        t6Detail,
        t6ProblemDetail,
        t6InitialSolution,
        t6Status,
        t6Images: cleanImgs,
      };
    },
    [
      t6IssueDetails,
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
    setLotNumber: setT6LotNumber,
    setT6LotNumber,
    t6PurchaseChannel,
    setPurchaseChannel: setT6PurchaseChannel,
    setT6PurchaseChannel,
    t6StoreId,
    setStoreId: setT6StoreId,
    setT6StoreId,
    t6StoreName,
    setStoreName: setT6StoreName,
    setT6StoreName,
    t6IssueType,
    setIssueType: setT6IssueType,
    setT6IssueType,
    t6Detail,
    setDetail: setT6Detail,
    setT6Detail,
    t6ProblemDetail,
    setT6ProblemDetail,
    t6InitialSolution,
    setT6InitialSolution,
    t6Status,
    setStatus: setT6Status,
    setT6Status,
    t6Images,
    setImages: setT6Images,
    setT6Images,
    t6IssueDetails,
    setT6IssueDetails,
    handleUpdateT6IssueItem,
    validate,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
