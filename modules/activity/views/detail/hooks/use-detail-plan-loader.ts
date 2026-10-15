"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { ActivityPlanWithRelations } from "@/modules/activity-plans/types";
import {
  getActivityPlanAction,
  getDemoPlotHistoryAction,
  requestCancelActivityPlanAction,
} from "@/modules/activity-plans/server/actions";
import { extractPlanData, parseResultSummary } from "../../actual/utils";
import { initialTargets, initialPlanSummary } from "../../actual/constants";
import type { PlanSummaryData, ActualTargetsState, ParsedSummaryValues } from "../../actual/types";
import { extractType1PlanTargets } from "@/modules/activity/features/type-1";

interface UseDetailPlanLoaderProps {
  id: string;
}

export function useDetailPlanLoader({ id }: UseDetailPlanLoaderProps) {
  const { data: session } = useSession();

  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [planSummary, setPlanSummary] = useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);
  const [parsedResults, setParsedResults] = useState<ParsedSummaryValues>({});

  // Type 7 Demo Plot data
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);
  const [t7VisitHistory, setT7VisitHistory] = useState<any[]>([]);

  // Cancellation State
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        const p = res.plan as ActivityPlanWithRelations;
        setPlan(p);

        // Extract plan summary & targets
        const extracted = extractPlanData(p, initialTargets);
        setPlanSummary(extracted.planSummary);
        setPlanWorkTypes(extracted.resolvedWorkTypes);
        setTargets(extracted.targets);

        // Parse result summary if plan result exists
        if ((p as any).result) {
          const parsed = parseResultSummary({
            ...(p as any).result,
            activityPlan: p,
          });
          setParsedResults(parsed);
        }

        // Fetch demo plot history if applicable
        if (extracted.t7PlotIdentifier) {
          getDemoPlotHistoryAction(extracted.t7PlotIdentifier)
            .then((histRes) => {
              if (histRes.success && histRes.plot) {
                setT7DemoPlotData(histRes.plot);
                setT7VisitHistory(histRes.plot.visits || []);
              }
            })
            .catch((e) => {
              console.error("Failed to load demo plot history:", e);
            });
        }
      } else {
        setError(res.error || "ไม่สามารถดึงข้อมูลรายละเอียด Trip Plan ได้");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดรายละเอียด Trip Plan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Type 1 Target extraction
  const type1Targets = useMemo(() => {
    if (!plan) return { primary: targets.t1, list: targets.t1List || [] };
    return extractType1PlanTargets(plan, targets.t1);
  }, [plan, targets.t1, targets.t1List]);

  // User permissions & Ownership
  const userId = session?.user?.id;
  const userRoles = (session?.user as any)?.roles || [];
  const isAdmin =
    userRoles.includes("administrator") ||
    userRoles.includes("admin") ||
    userRoles.includes("ceo") ||
    (session?.user as any)?.role === "administrator";
  const isOwner = Boolean(
    plan && (plan.createdById === userId || plan.employee?.userId === userId),
  );
  const canRequestCancel =
    (isOwner || isAdmin) &&
    plan &&
    plan.status !== "CANCELLED" &&
    plan.status !== "REJECTED" &&
    plan.status !== "PENDING_CANCELLATION";

  // Handle plan cancellation request
  const handleCancelSubmit = async () => {
    if (!plan) return;
    if (!cancelReason.trim()) {
      setCancelError("กรุณาระบุเหตุผลในการขอยกเลิกแผนกิจกรรม");
      return;
    }

    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await requestCancelActivityPlanAction(
        plan.id,
        cancelReason.trim(),
      );
      if (res.success) {
        setCancelDialogOpen(false);
        setCancelReason("");
        loadData();
      } else {
        setCancelError(res.error || "เกิดข้อผิดพลาดในการขอยกเลิกแผน");
      }
    } catch (err: any) {
      setCancelError(err.message || "เกิดข้อผิดพลาดไม่คาดคิด");
    } finally {
      setCancelLoading(false);
    }
  };

  // Helper function to check if work type is active
  const isTypeActive = useCallback(
    (code: string, label: string) => {
      if (planWorkTypes.includes(code) || planWorkTypes.includes(label)) return true;
      if (
        code === "TYPE_1" &&
        ((plan as any)?.type1Stores?.length > 0 ||
          plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_1"))
      ) {
        return true;
      }
      return false;
    },
    [planWorkTypes, plan],
  );

  // Consolidated audit logs (approval + actual)
  const mergedLogs = useMemo(() => {
    if (!plan) return [];

    const approvalItems = (plan.approvalLogs || []).map((log) => ({
      id: `approval-${log.id}`,
      isActual: false as const,
      user: log.user,
      action: log.action,
      comment: log.comment,
      createdAt: new Date(log.createdAt),
      raw: log,
    }));

    const actualLogs = ((plan as any).result?.logs || []).map((log: any) => ({
      id: `actual-${log.id}`,
      isActual: true as const,
      user: log.user,
      action: log.action,
      comment: log.comment,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      createdAt: new Date(log.createdAt),
      raw: log,
    }));

    return [...approvalItems, ...actualLogs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [plan?.approvalLogs, (plan as any)?.result?.logs]);

  return {
    plan,
    loading,
    error,
    planSummary,
    planWorkTypes,
    targets,
    type1Targets,
    parsedResults,
    t7DemoPlotData,
    t7VisitHistory,
    mergedLogs,
    isTypeActive,
    canRequestCancel,
    cancelDialogOpen,
    setCancelDialogOpen,
    cancelReason,
    setCancelReason,
    cancelLoading,
    cancelError,
    handleCancelSubmit,
    reload: loadData,
  };
}
