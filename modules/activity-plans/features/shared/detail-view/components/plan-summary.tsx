"use client";

import React from "react";
import { FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanSummaryProps {
  objective?: string | null;
  notes?: string | null;
}

export function PlanSummary({ objective, notes }: PlanSummaryProps) {
  if (!objective && !notes) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      {objective && (
        <div className="p-4 sm:p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <FileText className="h-3.5 w-3.5" />
            วัตถุประสงค์
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {objective}
          </p>
        </div>
      )}
      {notes && (
        <div className={cn("px-4 sm:px-5 pb-4 sm:pb-5", objective && "pt-0")}>
          <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-100">
            <h4 className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1">
              <AlertCircle className="h-3 w-3" />
              หมายเหตุ
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
              {notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
