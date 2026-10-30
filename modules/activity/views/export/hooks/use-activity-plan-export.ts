"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import {
  getActivityPlanAction,
  getRecentActivityPlansForExportAction,
} from "@/modules/activity/server/planned.actions";
import { getWorkTypeName, getWorkTypeCode } from "@/modules/activity/constants";

export interface AvailableWorkTypeOption {
  code: string;
  name: string;
}

export interface PlanListOption {
  id: string;
  code: string | null;
  title: string;
  creatorName: string;
}

export function useActivityPlanExport(initialId?: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Selected Plan ID (from prop, query param, or list)
  const urlId = searchParams?.get("id") || searchParams?.get("planId") || "";
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialId || urlId || "",
  );

  const [availablePlans, setAvailablePlans] = useState<PlanListOption[]>([]);
  const [loadingPlansList, setLoadingPlansList] = useState(false);

  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month & Year Filter for Mode ALL
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Settings State
  const [mode, setMode] = useState<"ALL" | "SINGLE">("ALL");
  const [selectedTypeCode, setSelectedTypeCode] = useState<string>("");
  const [includeActual, setIncludeActual] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [pageBreakPerType, setPageBreakPerType] = useState(true);

  // Preview State
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // 1. Fetch available plans for switcher dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadPlansList() {
      setLoadingPlansList(true);
      try {
        const res = await getRecentActivityPlansForExportAction();
        if (res.success && res.plans && isMounted) {
          setAvailablePlans(res.plans);
          // If no plan is currently selected, pick the first one
          if (!selectedPlanId && res.plans.length > 0) {
            setSelectedPlanId(res.plans[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load plans list:", err);
      } finally {
        if (isMounted) setLoadingPlansList(false);
      }
    }

    loadPlansList();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch specific plan details whenever selectedPlanId changes
  useEffect(() => {
    let isMounted = true;
    async function fetchPlan() {
      if (!selectedPlanId) {
        setLoadingPlan(false);
        return;
      }
      setLoadingPlan(true);
      setError(null);
      try {
        const res = await getActivityPlanAction(selectedPlanId);
        if (res.success && res.plan) {
          if (isMounted) {
            const p = res.plan as ActivityPlanWithRelations;
            setPlan(p);

            // Sync Month and Year with plan's period
            if (p.fiscalMonth) {
              setSelectedMonth(p.fiscalMonth);
            } else if (p.startDate) {
              setSelectedMonth(new Date(p.startDate).getMonth() + 1);
            }

            if (p.fiscalYear) {
              setSelectedYear(p.fiscalYear);
            } else if (p.startDate) {
              setSelectedYear(new Date(p.startDate).getFullYear());
            }

            // Determine default selected type
            const firstType =
              p.workTypes?.[0]?.activityType?.code ||
              (p.workTypes?.[0] as any)?.workTypeCode ||
              p.activityType?.code ||
              "TYPE_1";
            setSelectedTypeCode(getWorkTypeCode(firstType));
          }
        } else {
          if (isMounted) setError(res.error || "ไม่พบข้อมูลแผนงาน");
        }
      } catch (err: any) {
        if (isMounted)
          setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน");
      } finally {
        if (isMounted) setLoadingPlan(false);
      }
    }

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [selectedPlanId]);

  // Available Work Types in this plan
  const availableWorkTypes = useMemo<AvailableWorkTypeOption[]>(() => {
    if (!plan) return [];
    const typesMap = new Map<string, string>();

    if (plan.workTypes && plan.workTypes.length > 0) {
      for (const wt of plan.workTypes) {
        const raw =
          wt.activityType?.code ||
          wt.activityType?.name ||
          (wt as any).workTypeCode ||
          "";
        const code = getWorkTypeCode(raw);
        if (code) {
          typesMap.set(code, getWorkTypeName(code) || code);
        }
      }
    }

    if (plan.activityType?.code) {
      const code = getWorkTypeCode(plan.activityType.code);
      if (code && !typesMap.has(code)) {
        typesMap.set(code, getWorkTypeName(code) || code);
      }
    }

    return Array.from(typesMap.entries()).map(([code, name]) => ({
      code,
      name,
    }));
  }, [plan]);

  // Fetch Live Preview HTML
  const fetchPreviewHtml = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const params = new URLSearchParams({
        mode,
        includeActual: String(includeActual),
        includePhotos: String(includePhotos),
      });

      if (mode === "ALL") {
        params.set("month", String(selectedMonth));
        params.set("year", String(selectedYear));
        if (selectedPlanId) {
          params.set("planId", selectedPlanId);
        }
      } else {
        if (!selectedPlanId) {
          setLoadingPreview(false);
          return;
        }
        params.set("type", selectedTypeCode || "ALL");
        params.set("pageBreakPerType", String(pageBreakPerType));
      }

      const endpoint = selectedPlanId
        ? `/api/activity-plans/${selectedPlanId}/pdf-html?${params.toString()}`
        : `/api/activity-plans/pdf-html?${params.toString()}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("Failed to load PDF preview");
      }
      const html = await res.text();
      setPreviewHtml(html);
    } catch (err: any) {
      console.error("Preview HTML error:", err);
    } finally {
      setLoadingPreview(false);
    }
  }, [
    selectedPlanId,
    mode,
    selectedMonth,
    selectedYear,
    selectedTypeCode,
    includeActual,
    includePhotos,
    pageBreakPerType,
  ]);

  // Automatically refresh preview when settings change
  useEffect(() => {
    if (mode === "ALL") {
      fetchPreviewHtml();
    } else if (!loadingPlan && plan) {
      fetchPreviewHtml();
    }
  }, [fetchPreviewHtml, mode, loadingPlan, plan]);

  // Fast Print via iframe
  const handlePrint = useCallback(() => {
    if (!iframeRef.current) return;
    try {
      const contentWindow = iframeRef.current.contentWindow;
      if (contentWindow) {
        contentWindow.focus();
        contentWindow.print();
      }
    } catch (err) {
      console.error("Print trigger error:", err);
      window.print();
    }
  }, []);

  // Download PDF via API
  const handleDownloadPdf = useCallback(async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams({
        mode,
        includeActual: String(includeActual),
        includePhotos: String(includePhotos),
        disposition: "attachment",
      });

      if (mode === "ALL") {
        params.set("month", String(selectedMonth));
        params.set("year", String(selectedYear));
        if (selectedPlanId) {
          params.set("planId", selectedPlanId);
        }
      } else {
        if (!selectedPlanId) {
          alert("กรุณาเลือกแผนงานที่ต้องการพิมพ์");
          setDownloadingPdf(false);
          return;
        }
        params.set("type", selectedTypeCode || "ALL");
        params.set("pageBreakPerType", String(pageBreakPerType));
      }

      const endpoint = selectedPlanId
        ? `/api/activity-plans/${selectedPlanId}/pdf?${params.toString()}`
        : `/api/activity-plans/pdf?${params.toString()}`;

      const filename =
        mode === "ALL"
          ? `รายงานสรุปแผนงานประจำเดือน-${selectedMonth}-${selectedYear + 543}.pdf`
          : `${plan?.code || "ActivityPlan"}${
              selectedTypeCode ? `-${selectedTypeCode}` : ""
            }.pdf`;

      const link = document.createElement("a");
      link.href = endpoint;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Download PDF error:", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }, [
    selectedPlanId,
    plan,
    mode,
    selectedMonth,
    selectedYear,
    selectedTypeCode,
    includeActual,
    includePhotos,
    pageBreakPerType,
  ]);

  const handleBack = useCallback(() => {
    if (selectedPlanId) {
      router.push(`/activity-plans/${selectedPlanId}`);
    } else {
      router.push("/activity-plans");
    }
  }, [router, selectedPlanId]);

  return {
    plan,
    selectedPlanId,
    setSelectedPlanId,
    availablePlans,
    loadingPlansList,
    loadingPlan,
    error,
    availableWorkTypes,
    mode,
    setMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedTypeCode,
    setSelectedTypeCode,
    includeActual,
    setIncludeActual,
    includePhotos,
    setIncludePhotos,
    pageBreakPerType,
    setPageBreakPerType,
    previewHtml,
    loadingPreview,
    downloadingPdf,
    iframeRef,
    handlePrint,
    handleDownloadPdf,
    handleRefreshPreview: fetchPreviewHtml,
    handleBack,
  };
}
