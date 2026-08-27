"use client";

import React from "react";
import { FileText, Calendar } from "lucide-react";
import type { PlanSummaryData } from "../types";

interface ActivitySummarySectionProps {
  summary: PlanSummaryData;
}

export function ActivitySummarySection({
  summary,
}: ActivitySummarySectionProps) {
  // ฟังก์ชันแปลงปี ค.ศ. เป็น พ.ศ.
  const formatThaiYear = (dateStr?: string) => {
    if (!dateStr) return "-";
    // ค้นหาปี ค.ศ. 4 หลัก (1900 - 2099) แล้วแปลงเป็น พ.ศ. (+543)
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  // Extract or format start / end times
  const rawStartTime =
    summary.startTimeStr ||
    (summary.timeStr?.includes(" - ")
      ? summary.timeStr.split(" - ")[0]
      : summary.timeStr);
  const rawEndTime =
    summary.endTimeStr ||
    (summary.timeStr?.includes(" - ")
      ? summary.timeStr.split(" - ")[1]
      : summary.timeStr);

  const formatTime = (timeRaw?: string) => {
    if (!timeRaw) return "08:00 น.";
    const t = timeRaw.trim();
    if (t.endsWith("น.") || t.endsWith("น")) return t;
    return `${t} น.`;
  };

  const startTimeDisplay = formatTime(rawStartTime);
  const endTimeDisplay = formatTime(rawEndTime);

  // แปลงเป็นปี พ.ศ.
  const startDateDisplay = formatThaiYear(summary.startDateStr);
  const endDateDisplay = formatThaiYear(
    (summary as any).endDateStr ?? summary.startDateStr,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Card 1: ชื่อแผน/กิจกรรม */}
      <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium mb-0.5">
            ชื่อแผน/กิจกรรม
          </p>
          <p className="text-base font-bold text-slate-800 truncate">
            {summary.title || "-"}
          </p>
        </div>
      </div>

      {/* Card 2: วันที่เริ่ม - สิ้นสุด */}
      <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium mb-0.5">
            วันที่เริ่ม - สิ้นสุด
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>
              {startDateDisplay} {startTimeDisplay}
            </span>
            <span className="text-slate-400 font-normal">—</span>
            <span>
              {endDateDisplay} {endTimeDisplay}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
