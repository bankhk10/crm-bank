import React from "react";
import { cn } from "@/lib/utils";
import type { ActivityStatus } from "../types";

const STATUS_STYLES: Record<
  ActivityStatus,
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
    className: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
};

export function ActivityStatusBadge({
  status,
  className,
}: {
  status?: ActivityStatus;
  className?: string;
}) {
  const info = status ? STATUS_STYLES[status] : null;

  if (!info) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        ไม่ระบุ
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm transition-colors",
        info.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", info.dot)} />
      {info.label}
    </span>
  );
}
