"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import type { ActivityPlanWithRelations } from "@/modules/activity-plans/types";
import {
  getActivityPlanAction,
  reviewSingleActivityHelperAction,
} from "@/modules/activity-plans/server/actions";
import { canUserPerformApproval } from "@/modules/activity-plans/ui/activity-status-badge";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
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
import type { ApprovalActionType } from "../components/approval-action-dialog";

interface UseApprovalDetailLoaderProps {
  id: string;
}

export function useApprovalDetailLoader({ id }: UseApprovalDetailLoaderProps) {
  const { data: session } = useSession();
  const { hasPermission } = usePermission("menu.activity_plans");

  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  const canManageOrApprove =
    isAdmin ||
    hasPermission("activity.approve") ||
    hasPermission("activity.manage");

  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [planSummary, setPlanSummary] = useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);
  const [parsedResults, setParsedResults] = useState<ParsedSummaryValues>({});

  // Approval Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ApprovalActionType>("APPROVE");

  // Helper review state
  const [reviewingHelperId, setReviewingHelperId] = useState<string | null>(null);
  const [rejectHelperDialogOpen, setRejectHelperDialogOpen] = useState(false);
  const [helperRejectReason, setHelperRejectReason] = useState("");
  const [isProcessingHelper, setIsProcessingHelper] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        const p = res.plan as ActivityPlanWithRelations;
        setPlan(p);

        // Extract plan summary & work types targets
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

  // Approval Eligibility Check
  const canPerformApproval = useMemo(() => {
    if (!plan) return false;
    return canUserPerformApproval(plan, session?.user);
  }, [plan, session?.user]);

  const handleOpenActionDialog = (type: ApprovalActionType) => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleApproveHelper = async (helperEmployeeId: string) => {
    setIsProcessingHelper(true);
    try {
      const res = await reviewSingleActivityHelperAction(
        id,
        helperEmployeeId,
        "APPROVE",
      );
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "ไม่สามารถอนุมัติได้");
      }
    } finally {
      setIsProcessingHelper(false);
    }
  };

  const handleRejectHelper = async () => {
    if (!reviewingHelperId) return;
    setIsProcessingHelper(true);
    try {
      const res = await reviewSingleActivityHelperAction(
        id,
        reviewingHelperId,
        "REJECT",
        helperRejectReason.trim(),
      );
      setRejectHelperDialogOpen(false);
      setHelperRejectReason("");
      setReviewingHelperId(null);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "ไม่สามารถดำเนินการได้");
      }
    } finally {
      setIsProcessingHelper(false);
    }
  };

  // Resolve Work Types from Normalized Relation
  const resolvedWorkTypes = useMemo(() => {
    if (!plan) return [];
    if (plan.workTypes && plan.workTypes.length > 0) {
      return plan.workTypes.map((wt: any) => ({
        code: wt.activityType?.code || "TYPE_1",
        name:
          wt.activityType?.name ||
          wt.activityType?.shortName ||
          "เข้าพบร้านค้า / Key Farmer",
      }));
    }
    if (plan.activityType) {
      return [{ code: plan.activityType.code, name: plan.activityType.name }];
    }
    return planWorkTypes.map((t) => ({ code: getWorkTypeCode(t), name: t }));
  }, [plan, planWorkTypes]);

  const isTypeActive = useCallback(
    (code: string, name: string): boolean => {
      return Boolean(
        resolvedWorkTypes.some((wt: any) => wt.code === code || wt.name === name) ||
        planWorkTypes.includes(name) ||
        (code === "TYPE_1" && ((plan as any)?.type1Stores?.length > 0 || plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_1")))
      );
    },
    [resolvedWorkTypes, planWorkTypes, plan],
  );

  return {
    plan,
    loading,
    error,
    session,
    isAdmin,
    canManageOrApprove,
    planSummary,
    planWorkTypes,
    resolvedWorkTypes,
    targets,
    type1Targets,
    parsedResults,
    canPerformApproval,
    actionDialogOpen,
    setActionDialogOpen,
    actionType,
    handleOpenActionDialog,
    reviewingHelperId,
    setReviewingHelperId,
    rejectHelperDialogOpen,
    setRejectHelperDialogOpen,
    helperRejectReason,
    setHelperRejectReason,
    isProcessingHelper,
    handleApproveHelper,
    handleRejectHelper,
    isTypeActive,
    reload: loadData,
  };
}
