"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ActivityStatus } from "../types";
import { ACTIVITY_RESULT_STATUS_LABELS } from "../constants";
import {
  useApproverDirectory,
  type ApproverDirectory,
} from "../hooks/use-approver-directory";
import {
  resolveCurrentOperator,
  formatApproverRole,
  formatEmployeeName,
  type CurrentOperatorInfo,
} from "../domain/approval";

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  DRAFT: {
    label: "ร่าง",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  PENDING_LINE_APPROVAL: {
    label: "รออนุมัติตามสายงาน",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  PENDING_MARKETING_APPROVAL: {
    label: "รออนุมัติการเบิกสินค้า",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  PENDING_BUDGET_APPROVAL: {
    label: "รออนุมัติงบประมาณ",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  PENDING_HELPER_APPROVAL: {
    label: "รออนุมัติคนช่วยงาน",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  APPROVED: {
    label: "อนุมัติสำเร็จ",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  PENDING_CANCELLATION: {
    label: "รออนุมัติการยกเลิก",
    className: "bg-rose-50 text-rose-800 border-rose-300 font-medium",
    dot: "bg-rose-500",
  },
  REJECTED: {
    label: "ปฏิเสธ",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  WAITING_FOR_CORRECTION: {
    label: "รอแก้ไข/ข้อมูลเพิ่ม",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  PENDING_REVIEW: {
    label: "รอตรวจสอบ",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  REVIEWED: {
    label: "ตรวจสอบแล้ว",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  RETURNED: {
    label: "ส่งกลับแก้ไข",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  // Actual Result statuses
  COMPLETED: {
    label: ACTIVITY_RESULT_STATUS_LABELS.COMPLETED,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  PARTIAL: {
    label: ACTIVITY_RESULT_STATUS_LABELS.PARTIAL,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  POSTPONED: {
    label: ACTIVITY_RESULT_STATUS_LABELS.POSTPONED,
    className: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  FAILED: {
    label: ACTIVITY_RESULT_STATUS_LABELS.FAILED || "ไม่สำเร็จ",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

/**
 * Pure UI Presentation: Render badge based on status / resultStatus
 */
export function ActivityStatusBadge({
  status,
  resultStatus,
  className,
}: {
  status?: ActivityStatus | string;
  resultStatus?: string;
  className?: string;
}) {
  const isLifecycleWorkflowState =
    status === "PENDING_CANCELLATION" ||
    status === "CANCELLED" ||
    status === "REJECTED" ||
    status === "DRAFT" ||
    status === "WAITING_FOR_CORRECTION" ||
    status === "RETURNED" ||
    (typeof status === "string" && status.startsWith("PENDING_"));

  const effectiveKey = (
    isLifecycleWorkflowState ? status || resultStatus : resultStatus || status
  ) as string | undefined;
  const info = effectiveKey ? STATUS_STYLES[effectiveKey] : null;

  if (!info) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        ไม่ระบุ
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-2xs transition-colors whitespace-nowrap",
        info.className,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full animate-pulse", info.dot)}
      />
      {info.label}
    </span>
  );
}

/**
 * Composite UI Presentation: Status Badge + Operator description
 */
export function ActivityStatusWithOperator({
  plan,
  resultStatus,
  className,
  badgeClassName,
}: {
  plan?: any;
  resultStatus?: string;
  className?: string;
  badgeClassName?: string;
}) {
  const approverDirectory = useApproverDirectory();
  if (!plan) return null;
  const operator = resolveCurrentOperator(plan, approverDirectory);

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-0.5 py-0.5 min-w-[120px]",
        className,
      )}
    >
      <ActivityStatusBadge
        status={plan.status}
        resultStatus={resultStatus}
        className={badgeClassName}
      />
      {operator && (
        <div className="text-[11px] text-slate-500 leading-tight flex flex-wrap items-center gap-1 font-normal mt-0.5">
          <span>ผู้ดำเนินการ:</span>
          <span className="font-semibold text-slate-700">
            {operator.roleTitleTh || operator.displayRole}
          </span>
        </div>
      )}
    </div>
  );
}

// Re-exports for backward compatibility
export {
  useApproverDirectory,
  type ApproverDirectory,
  formatApproverRole,
  formatEmployeeName,
  resolveCurrentOperator,
  type CurrentOperatorInfo,
  isUserAdmin,
  isUserSalesAdminManager,
  isUserMarketingManager,
  isUserSalesDirector,
  canUserPerformApproval,
  getPlanActionScopes,
  type ApproverUserContext,
  type ActionScopeBadge,
} from "../domain/approval";
