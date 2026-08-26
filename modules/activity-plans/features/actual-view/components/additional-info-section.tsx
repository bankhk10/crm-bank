"use client";

import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanSummaryData } from "../types";

interface AdditionalInfoSectionProps {
  summary: PlanSummaryData;
}

export function AdditionalInfoSection({ summary }: AdditionalInfoSectionProps) {
  const hasNotes =
    !!summary.notes &&
    summary.notes.trim() !== "" &&
    summary.notes.trim() !== "-";
  const hasHelpers =
    !!summary.helperEmployeeNames && summary.helperEmployeeNames.length > 0;
  const hasAdditionalInfo = hasNotes || hasHelpers;

  if (!hasAdditionalInfo) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-sky-700">
        <Info className="w-4 h-4 shrink-0" />
        <span className="text-xs sm:text-sm font-bold">ข้อมูลเพิ่มเติม</span>
      </div>

      <div
        className={cn(
          "grid gap-3.5",
          hasNotes && hasHelpers ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* หมายเหตุเพิ่มเติม */}
        {hasNotes && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <span className="text-xs text-slate-400 font-medium mb-1 block">
              หมายเหตุเพิ่มเติม
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-relaxed block">
              {summary.notes}
            </span>
          </div>
        )}

        {/* หน่วยงานผู้เพิ่มเติม / ผู้ช่วยงาน */}
        {hasHelpers && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <span className="text-xs text-slate-400 font-medium mb-1 block">
              หน่วยงานผู้เพิ่มเติม
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-relaxed block">
              {summary.helperEmployeeNames!.join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
