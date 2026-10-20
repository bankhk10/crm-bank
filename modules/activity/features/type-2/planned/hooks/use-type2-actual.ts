"use client";

import { useState, useRef, useCallback } from "react";
import type { Type2ImageFile } from "../../shared/types";
import type { FollowupProductItem } from "../types/planned.types";

import { uploadActivityPlanImageGroup } from "@/modules/activity/application/media/image-uploader";
import { parseType2ActualResult } from "../application/actual-mapper";

export function useType2Actual() {
  const [t2CustomerName, setT2CustomerName] = useState("");
  const [t2FollowupDetail, setT2FollowupDetail] = useState("");
  const [t2Detail, setT2Detail] = useState("");
  const [t2UsageResult, setT2UsageResult] = useState<
    "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | ""
  >("");
  const [t2ProblemDetail, setT2ProblemDetail] = useState("");
  const [t2FollowupResults, setT2FollowupResults] = useState<
    FollowupProductItem[]
  >([]);
  const [t2Images, setT2Images] = useState<Type2ImageFile[]>([]);
  const initialT2ImagesRef = useRef<Type2ImageFile[]>([]);

  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[] = [],
    ): Promise<Type2ImageFile[]> => {
      let cleanImages = t2Images;
      if (t2Images && t2Images.length > 0) {
        const res = await uploadActivityPlanImageGroup(
          planId,
          t2Images,
          "type2",
          "plot",
        );
        cleanImages = res.updatedImages;
        newlyUploadedUrls.push(...res.newlyUploadedUrls);
        setT2Images(cleanImages);
      }
      return cleanImages;
    },
    [t2Images],
  );

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;

    // Normalize data: support Prisma ActivityResult object, parsed result, or plain payload
    const normalized: any =
      parsed.followupResults || parsed.resultSummary
        ? parseType2ActualResult(parsed)
        : {};

    const followupList =
      parsed.t2FollowupResults ||
      (Array.isArray(parsed.followupResults) && parsed.followupResults[0]?.usageResult !== undefined
        ? parsed.followupResults
        : normalized.followupResults);

    const customer =
      parsed.t2CustomerName || parsed.customerName || normalized.customerName;

    const usage =
      parsed.t2UsageResult || parsed.usageResult || normalized.usageResult;

    const followup =
      parsed.t2FollowupDetail ||
      parsed.followupDetail ||
      normalized.followupDetail;

    const problem =
      parsed.t2ProblemDetail ||
      parsed.problemDetail ||
      normalized.problemDetail;

    if (customer) setT2CustomerName(customer);
    if (followupList && Array.isArray(followupList) && followupList.length > 0) {
      setT2FollowupResults(followupList);
    }
    if (usage) {
      setT2UsageResult(usage as any);
    }

    const isProblem =
      usage === "พบปัญหา" ||
      (typeof usage === "string" &&
        usage.includes("พบปัญหา") &&
        !usage.includes("พืชตอบสนองดี") &&
        !usage.includes("ลูกค้าพึงพอใจ"));

    if (isProblem) {
      setT2FollowupDetail("");
      setT2Detail("");
      if (problem) {
        setT2ProblemDetail(problem);
      }
    } else {
      if (followup) {
        setT2FollowupDetail(followup);
        setT2Detail(followup);
      }
      if (usage === "พืชตอบสนองดี" || usage === "ลูกค้าพึงพอใจ") {
        setT2ProblemDetail("");
      } else if (problem) {
        setT2ProblemDetail(problem);
      }
    }

    const imagesList = parsed.t2Images || parsed.images || parsed.attachments;
    if (imagesList && Array.isArray(imagesList) && imagesList.length > 0) {
      const normalizedImages = imagesList
        .filter(
          (img: any) =>
            img.workTypeCode === "TYPE_2" ||
            !img.workTypeCode ||
            img.category === "PLOT",
        )
        .map((img: any) => ({
          id: img.id,
          url: img.url || img.fileUrl,
          name: img.name || img.fileName || "รูปภาพ",
          size: img.size || img.fileSize || 0,
          type: img.type || img.mimeType || "image/jpeg",
        }));
      const seenIds = new Set<string>();
      const seenUrls = new Set<string>();
      const uniqueImages = normalizedImages.filter((img: any) => {
        if (!img) return false;
        if (img.id && seenIds.has(img.id)) return false;
        if (img.url && seenUrls.has(img.url)) return false;
        if (img.id) seenIds.add(img.id);
        if (img.url) seenUrls.add(img.url);
        return true;
      });
      if (uniqueImages.length > 0) {
        setT2Images(uniqueImages);
        initialT2ImagesRef.current = JSON.parse(JSON.stringify(uniqueImages));
      }
    }
  }, []);

  const collectPayload = useCallback((cleanImages: Type2ImageFile[] = t2Images) => {
    const isProblem =
      t2UsageResult === "พบปัญหา" ||
      (typeof t2UsageResult === "string" &&
        t2UsageResult.includes("พบปัญหา") &&
        !t2UsageResult.includes("พืชตอบสนองดี") &&
        !t2UsageResult.includes("ลูกค้าพึงพอใจ"));

    const resolvedDetail = isProblem ? "" : t2FollowupDetail;
    const resolvedProblemDetail =
      t2UsageResult === "พืชตอบสนองดี" || (t2UsageResult as string) === "ลูกค้าพึงพอใจ"
        ? ""
        : t2ProblemDetail;

    return {
      t2CustomerName,
      t2FollowupDetail: resolvedDetail,
      t2Detail: resolvedDetail,
      t2UsageResult,
      t2ProblemDetail: resolvedProblemDetail,
      t2FollowupResults,
      t2Images: cleanImages,
    };
  }, [
    t2CustomerName,
    t2FollowupDetail,
    t2UsageResult,
    t2ProblemDetail,
    t2FollowupResults,
    t2Images,
  ]);

  return {
    t2CustomerName,
    setT2CustomerName,
    t2FollowupDetail,
    setT2FollowupDetail,
    t2Detail,
    setT2Detail,
    t2UsageResult,
    setT2UsageResult,
    t2ProblemDetail,
    setT2ProblemDetail,
    t2FollowupResults,
    setT2FollowupResults,
    t2Images,
    setT2Images,
    hydrate,
    collectPayload,
    uploadImages,
  };
}
