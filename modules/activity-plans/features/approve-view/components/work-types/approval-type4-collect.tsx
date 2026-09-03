"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType4CollectProps {
  isVisible: boolean;
  target: ActualTargetsState["t4"];
}

export function ApprovalType4Collect({
  isVisible,
  target,
}: ApprovalType4CollectProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-amber-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <DollarSign className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-amber-900 text-sm sm:text-base">
            วางบิล / เก็บเงิน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-amber-50 text-amber-800 border-amber-200"
        >
          TYPE_4
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/80 sm:col-span-1">
          <span className="text-amber-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            วางบิลและติดตามยอดเก็บเงิน
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ลูกค้า / ร้านค้า
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.customer || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เป้ายอดเก็บเงิน
          </span>
          <span className="font-bold text-amber-700 block text-xs sm:text-sm">
            {target.targetCollect
              ? `${Number(target.targetCollect).toLocaleString()} ฿`
              : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
