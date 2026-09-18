"use client";

import React from "react";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType10FieldDayProps {
  isVisible: boolean;
  target: ActualTargetsState["t10"];
}

export function ApprovalType10FieldDay({
  isVisible,
  target,
}: ApprovalType10FieldDayProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-cyan-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-cyan-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-200">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-cyan-900 text-sm sm:text-base">
            จัดงาน Field Day
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-cyan-50 text-cyan-800 border-cyan-200"
        >
          TYPE_10
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-cyan-50/40 p-3 rounded-xl border border-cyan-100/80 sm:col-span-1">
          <span className="text-cyan-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            จัดงานวันถ่ายทอดเทคโนโลยีการเกษตร (Field Day)
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            แปลงสาธิต / สถานที่
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.plot || target.location || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            สินค้าที่จัดแสดง & เป้าหมาย
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {[
              target.showcase,
              target.targetAttendees ? `ผู้เข้าร่วม ${target.targetAttendees} คน` : "",
            ]
              .filter(Boolean)
              .join(" • ") || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
