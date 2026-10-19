"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import {
  getActivityPlanAction,
  requestCancelActivityPlanAction,
} from "@/modules/activity/server/actions";
import {
  extractPlanData,
  parseResultSummary,
} from "@/modules/activity-plans/features/shared/actual-view/utils";
import {
  initialTargets,
  initialPlanSummary,
} from "@/modules/activity-plans/features/shared/actual-view/constants";
import type {
  PlanSummaryData,
  ActualTargetsState,
  ParsedSummaryValues,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import { extractType1PlanTargets } from "@/modules/activity/features/type-1";

interface UseDetailPlanLoaderProps {
  id: string;
  onBack?: () => void;
}

export function useDetailPlanLoader({ id, onBack }: UseDetailPlanLoaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [planSummary, setPlanSummary] = useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);
  const [parsedResults, setParsedResults] = useState<ParsedSummaryValues>({});

  // Cancellation State
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.push("/activity-plans");
    }
  }, [onBack, router]);

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

        // Parse result summary if plan result exists or unplanned activity
        if (
          (p as any).result ||
          (p as any).type1Result ||
          ((p as any).type1Results && (p as any).type1Results.length > 0) ||
          p.planType === "UNPLANNED"
        ) {
          const parsed = parseResultSummary({
            ...((p as any).result || {}),
            activityPlan: p,
          });
          setParsedResults(parsed);
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

  // Resolved Work Types list
  const resolvedWorkTypes = useMemo(() => {
    if (!plan) return [];
    const list: Array<{ code: string; name: string }> = [];

    // 1. From normalized workTypes
    if (plan.workTypes && Array.isArray(plan.workTypes)) {
      plan.workTypes.forEach((wt: any) => {
        const at = wt.activityType;
        if (at && !list.some((i) => i.code === at.code)) {
          list.push({ code: at.code, name: at.name });
        }
      });
    }

    // 2. From primary activityType
    if (plan.activityType && !list.some((i) => i.code === plan.activityType?.code)) {
      list.push({
        code: plan.activityType.code,
        name: plan.activityType.name,
      });
    }

    // 3. From stores
    (plan.stores || []).forEach((s: any) => {
      if (s.workTypeCode && !list.some((i) => i.code === s.workTypeCode)) {
        list.push({ code: s.workTypeCode, name: s.workType?.name || s.workTypeCode });
      }
    });

    // 4. From type1Stores
    if (
      ((plan as any).type1Stores?.length > 0 || list.some((i) => i.code === "TYPE_1")) &&
      !list.some((i) => i.code === "TYPE_1")
    ) {
      list.unshift({ code: "TYPE_1", name: "เข้าพบร้านค้า / Key Farmer" });
    }
    return list;
  }, [plan]);

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
      if (code === "TYPE_1") {
        if (
          (plan as any)?.type1Stores?.length > 0 ||
          plan?.stores?.some(
            (s: any) =>
              s.workTypeCode === "TYPE_1" ||
              s.workTypeCode === "เข้าพบร้านค้า / Key Farmer",
          ) ||
          plan?.activityType?.code === "TYPE_1" ||
          plan?.activityType?.name?.includes("เข้าพบ") ||
          (plan as any)?.workTypes?.some(
            (wt: any) =>
              wt.activityType?.code === "TYPE_1" ||
              wt.activityType?.name?.includes("เข้าพบ"),
          )
        ) {
          return true;
        }
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
    resolvedWorkTypes,
    targets,
    type1Targets,
    parsedResults,
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
    handleBack,
    reload: loadData,
  };
}
