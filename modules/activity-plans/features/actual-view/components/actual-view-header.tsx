"use client";

import React from "react";
import { FileText, Info } from "lucide-react";

interface ActualViewHeaderProps {
  planNo?: string;
}

export function ActualViewHeader({ planNo }: ActualViewHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
      {/* Center: Icon + Title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3.5">
        <h1 className="font-bold text-xl sm:text-2xl text-slate-800 tracking-tight whitespace-nowrap">
          บันทึกผลการปฏิบัติงาน ( Trip Plan Actual )
        </h1>
      </div>

      {/* Right: Plan No */}
      {planNo && (
        <div className="ml-auto self-start sm:self-auto inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>เลขที่แผน: {planNo}</span>
        </div>
      )}
    </div>
  );
}
