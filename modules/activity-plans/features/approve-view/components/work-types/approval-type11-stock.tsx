"use client";

import React from "react";
import { Boxes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType11StockProps {
  isVisible: boolean;
  target: ActualTargetsState["t11"];
}

export function ApprovalType11Stock({
  isVisible,
  target,
}: ApprovalType11StockProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <Boxes className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
            ตรวจเช็กสต็อกหน้าร้าน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-slate-50 text-slate-700 border-slate-300"
        >
          TYPE_11
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            รายชื่อร้านค้าที่ตรวจเช็กสต็อก
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.store || "-"}
          </span>
        </div>

        {target.detail && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดเพิ่มเติม
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
