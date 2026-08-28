"use client";

import React from "react";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType1VisitProps {
  isVisible: boolean;
  target: ActualTargetsState["t1"];
}

export function ApprovalType1Visit({
  isVisible,
  target,
}: ApprovalType1VisitProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Store className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
            เข้าพบร้านค้า / Key Farmer
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
        >
          TYPE_1
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80 sm:col-span-1">
          <span className="text-emerald-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน (ประเด็นหลัก)
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.topic || "เข้าพบประจำเดือน"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ลูกค้าร้านค้าเป้าหมาย
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.customer || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            รายละเอียดเพิ่มเติม
          </span>
          <span className="text-slate-700 block text-xs whitespace-pre-line">
            {target.detail || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
