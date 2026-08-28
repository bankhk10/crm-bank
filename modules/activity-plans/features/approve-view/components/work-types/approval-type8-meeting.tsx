"use client";

import React from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType8MeetingProps {
  isVisible: boolean;
  target: ActualTargetsState["t8"];
}

export function ApprovalType8Meeting({
  isVisible,
  target,
}: ApprovalType8MeetingProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-indigo-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-indigo-900 text-sm sm:text-base">
            จัดประชุมการเกษตร
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-indigo-50 text-indigo-800 border-indigo-200"
        >
          TYPE_8
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/80 sm:col-span-1">
          <span className="text-indigo-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ / หัวข้อประชุม
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.topic || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เป้าหมายผู้เข้าร่วม
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.targetAttendees ? `${target.targetAttendees} คน` : "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            สินค้าเป้าหมาย
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.products || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
