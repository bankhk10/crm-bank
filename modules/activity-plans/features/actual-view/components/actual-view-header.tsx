"use client";

import React from "react";
import { Info } from "lucide-react";

interface ActualViewHeaderProps {
  planNo?: string;
}

export function ActualViewHeader({ planNo }: ActualViewHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-100 min-w-0">
      {/* Center: Title (Responsive Flow on Mobile, Absolute Centered on Desktop) */}
      <div className="w-full sm:w-auto text-center sm:text-left sm:absolute sm:left-1/2 sm:-translate-x-1/2 min-w-0">
        <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight leading-snug break-words">
          <span className="hidden sm:inline whitespace-nowrap">
            บันทึกผลการปฏิบัติงาน ( Trip Plan Actual )
          </span>
          <span className="inline sm:hidden">
            บันทึกผลการปฏิบัติงาน
            <br />
            <span className="text-slate-600 text-sm font-semibold">
              ( Trip Plan Actual )
            </span>
          </span>
        </h1>
      </div>

      {/* Right: Plan No */}
      {planNo && (
        <div className="w-full sm:w-auto flex justify-center sm:justify-end sm:ml-auto shrink-0 z-10">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>เลขที่แผน: {planNo}</span>
          </div>
        </div>
      )}
    </div>
  );
}

