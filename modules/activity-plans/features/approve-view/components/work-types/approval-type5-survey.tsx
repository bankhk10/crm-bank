"use client";

import React from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType5SurveyProps {
  isVisible: boolean;
  target: ActualTargetsState["t5"];
}

export function ApprovalType5Survey({
  isVisible,
  target,
}: ApprovalType5SurveyProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-purple-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Search className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-purple-900 text-sm sm:text-base">
            สำรวจตลาดของคู่แข่ง
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-purple-50 text-purple-800 border-purple-200"
        >
          TYPE_5
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/80 sm:col-span-1">
          <span className="text-purple-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            สำรวจตลาดและเปรียบเทียบราคาสินค้าคู่แข่ง
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ร้านค้าที่สำรวจ
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.store || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            สินค้าคู่แข่งที่เปรียบเทียบ
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.product || "-"}
          </span>
        </div>

        {target.detail && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดการสำรวจ
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
