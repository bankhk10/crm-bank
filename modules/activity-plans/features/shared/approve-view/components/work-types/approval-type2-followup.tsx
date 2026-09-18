"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType2FollowupProps {
  isVisible: boolean;
  target: ActualTargetsState["t2"];
}

export function ApprovalType2Followup({
  isVisible,
  target,
}: ApprovalType2FollowupProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-teal-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-teal-900 text-sm sm:text-base">
            ติดตามผลการใช้สินค้า
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-teal-50 text-teal-800 border-teal-200"
        >
          TYPE_2
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-teal-50/40 p-3 rounded-xl border border-teal-100/80 sm:col-span-1">
          <span className="text-teal-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            ติดตามผลการใช้สินค้าและประสิทธิภาพ
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            สินค้าที่ติดตามผล
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.product || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ร้านค้า / เกษตรกร
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.customer || "-"}
          </span>
        </div>

        {target.detail && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดการติดตามผล
            </span>
            <span className="text-slate-700 block text-xs whitespace-pre-line">
              {target.detail}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
