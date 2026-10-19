"use client";

import { useState, useRef, useCallback } from "react";
import type { Type2ImageFile } from "../../shared/types";
import type { FollowupProductItem } from "../types/planned.types";

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

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t2CustomerName) setT2CustomerName(parsed.t2CustomerName);
    if (parsed.t2FollowupResults && parsed.t2FollowupResults.length > 0) {
      setT2FollowupResults(parsed.t2FollowupResults);
    }
    if (parsed.t2UsageResult) {
      setT2UsageResult(parsed.t2UsageResult as any);
    }

    const isProblem =
      parsed.t2UsageResult === "พบปัญหา" ||
      (typeof parsed.t2UsageResult === "string" &&
        parsed.t2UsageResult.includes("พบปัญหา") &&
        !parsed.t2UsageResult.includes("พืชตอบสนองดี") &&
        !parsed.t2UsageResult.includes("ลูกค้าพึงพอใจ"));

    if (isProblem) {
      setT2FollowupDetail("");
      setT2Detail("");
      if (parsed.t2ProblemDetail) {
        setT2ProblemDetail(parsed.t2ProblemDetail);
      }
    } else {
      if (parsed.t2FollowupDetail) {
        setT2FollowupDetail(parsed.t2FollowupDetail);
        setT2Detail(parsed.t2FollowupDetail);
      }
      if (
        parsed.t2UsageResult === "พืชตอบสนองดี" ||
        parsed.t2UsageResult === "ลูกค้าพึงพอใจ"
      ) {
        setT2ProblemDetail("");
      } else if (parsed.t2ProblemDetail) {
        setT2ProblemDetail(parsed.t2ProblemDetail);
      }
    }

    if (parsed.t2Images && parsed.t2Images.length > 0) {
      setT2Images(parsed.t2Images);
      initialT2ImagesRef.current = JSON.parse(
        JSON.stringify(parsed.t2Images),
      );
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
  };
}
