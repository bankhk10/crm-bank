"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActivityPlanWithRelations } from "../../types";
import {
  getActivityPlanAction,
  approveActivityPlanAction,
  rejectActivityPlanAction,
  requestCorrectionPlanAction,
  cancelActivityPlanAction,
} from "../../server/actions";
import {
  extractWorkTypeSections,
  extractMarketingProducts,
  extractSalesPromotions,
  extractRequisitions,
} from "./utils";
import { DetailHeader } from "./components/detail-header";
import { DetailOverview } from "./components/detail-overview";
import { PlanSummary } from "./components/plan-summary";
import { PlanVsActual } from "./components/plan-vs-actual";
import { WorkTypeList } from "./components/work-type-list";
import { BudgetSummary } from "./components/budget-summary";
import { MaterialsSection } from "./components/materials-section";
import { HelpersSection } from "./components/helpers-section";
import { PlanMetaInfo } from "./components/plan-meta-info";
import { ApprovalActionPanel } from "./components/approval-action-panel";
import { ApprovalHistory } from "./components/approval-history";

interface Props {
  id: string;
}

export default function ActivityPlanDetailView({ id }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load details
  async function loadData() {
    setLoading(true);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        setPlan(res.plan);
      } else {
        setError(res.error || "ไม่สามารถดึงข้อมูลรายละเอียด Trip Plan ได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการโหลดรายละเอียด Trip Plan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูล Trip Plan...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูล Trip Plan"}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push("/activity-plans")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> กลับหน้ารายการแผนงาน
        </Button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Check if current user is an approver at the current state
  // ────────────────────────────────────────────────────────
  const userEmployeeId = session?.user?.employeeId;
  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  let canApproveThisStep = false;
  let approvalPrompt = "";

  const isPending =
    plan.status === "PENDING_LINE_APPROVAL" ||
    plan.status === "PENDING_BUDGET_APPROVAL" ||
    plan.status === "PENDING_HELPER_APPROVAL";

  if (isAdmin && isPending) {
    canApproveThisStep = true;
    approvalPrompt =
      "คุณมีสิทธิ์ Administrator ในการอนุมัติ/จัดการ Trip Plan นี้";
  } else if (plan.status === "PENDING_LINE_APPROVAL") {
    canApproveThisStep = userEmployeeId === plan.currentApproverEmployeeId;
    approvalPrompt = "คุณคือหัวหน้างานในสายการอนุมัติ Trip Plan นี้";
  } else if (plan.status === "PENDING_BUDGET_APPROVAL") {
    const canApproveBudget =
      session?.user?.permissionKeys?.includes("activity.approve") ||
      session?.user?.permissionKeys?.includes("activity.manage");
    if (canApproveBudget) {
      canApproveThisStep = true;
      approvalPrompt = "คุณมีสิทธิ์อนุมัติงบประมาณ Trip Plan";
    }
  } else if (plan.status === "PENDING_HELPER_APPROVAL") {
    const isHelperManager = plan.helpers.some(
      (h) =>
        h.employeeId === userEmployeeId || h.approvedById === userEmployeeId,
    );
    if (
      isHelperManager ||
      session?.user?.permissionKeys?.includes("activity.manage")
    ) {
      canApproveThisStep = true;
      approvalPrompt = "คุณคือผู้จัดการแผนกของพนักงานช่วยงาน";
    }
  }

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await approveActivityPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError("กรุณาระบุความเห็นกรณีปฏิเสธแผน");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await rejectActivityPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!comment.trim()) {
      setError("กรุณาระบุสิ่งที่ต้องแก้ไขในความเห็น");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await requestCorrectionPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการตีกลับแก้ไข");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!window.confirm("ยืนยันการยกเลิก Trip Plan นี้ใช่หรือไม่?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await cancelActivityPlanAction(plan.id);
      if (res.success) {
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการยกเลิก");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Conditions
  const canEdit =
    (plan.status === "DRAFT" || plan.status === "WAITING_FOR_CORRECTION") &&
    (plan.createdById === session?.user?.id || isAdmin);

  const canCancel =
    plan.createdById === session?.user?.id &&
    plan.status !== "APPROVED" &&
    plan.status !== "REJECTED" &&
    plan.status !== "CANCELLED";

  // Data Extraction
  const workTypeSections = extractWorkTypeSections(plan);
  const marketingProducts = extractMarketingProducts(plan);
  const salesPromotions = extractSalesPromotions(plan);
  const requisitions = extractRequisitions(plan);

  return (
    <section className="space-y-5 p-4 md:p-6 pb-28 md:pb-12 max-w-6xl mx-auto">
      {/* 1. Header (Code, Title, Status, Actions) */}
      <DetailHeader plan={plan} canEdit={canEdit} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 2. Overview Summary Cards */}
      <DetailOverview plan={plan} />

      {/* 3. Plan vs Actual (when result recorded) */}
      <PlanVsActual plan={plan} />

      {/* 4. Main 2-Column Layout */}
      <div className="grid gap-5 lg:grid-cols-3 items-start">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Plan Summary (Objective & Notes) */}
          <PlanSummary objective={plan.objective} notes={(plan as any).notes} />

          {/* Activity / Work Types Accordion */}
          <WorkTypeList sections={workTypeSections} />

          {/* Budget Summary & Breakdown */}
          <BudgetSummary plan={plan} salesPromotions={salesPromotions} />

          {/* Materials & Requisitions */}
          <MaterialsSection
            marketingProducts={marketingProducts}
            requisitions={requisitions}
          />

          {/* Helper Employees */}
          <HelpersSection helpers={plan.helpers} />
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-5">
          {/* Approval Action Panel & Cancel */}
          <ApprovalActionPanel
            canApprove={canApproveThisStep}
            approvalPrompt={approvalPrompt}
            comment={comment}
            onCommentChange={setComment}
            submitting={submitting}
            onApprove={handleApprove}
            onRequestCorrection={handleRequestCorrection}
            onReject={handleReject}
            canCancel={canCancel}
            onCancel={handleCancelPlan}
          />

          {/* Plan Metadata */}
          <PlanMetaInfo plan={plan} />

          {/* Approval History Timeline */}
          <ApprovalHistory logs={plan.approvalLogs} />
        </div>
      </div>
    </section>
  );
}
