"use client";

import React from "react";
import { FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "@/modules/activity-plans/types";
import type { PlanSummaryData } from "@/modules/activity-plans/features/shared/actual-view/types";

interface DetailHeaderProps {
  plan: ActivityPlanWithRelations;
  planSummary?: PlanSummaryData;
}

export function DetailHeader({ plan, planSummary }: DetailHeaderProps) {
  const isUnplanned = plan.planType === "UNPLANNED";
  const planNo = plan.code || planSummary?.planNo;

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
      <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
          <FileText className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight whitespace-nowrap">
            {isUnplanned
              ? "รายละเอียดกิจกรรมนอกแผน ( Unplanned Activity Detail )"
              : "รายละเอียดแผนงาน ( Trip Plan Detail )"}
          </h1>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <span
          className={cn(
            "inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs border",
            isUnplanned
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-blue-50 text-blue-700 border-blue-200",
          )}
        >
          {isUnplanned ? "นอกแผน" : "ตามแผน"}
        </span>
        {planNo && (
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isUnplanned ? "เลขที่กิจกรรม: " : "เลขที่แผน: "}
              {planNo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
