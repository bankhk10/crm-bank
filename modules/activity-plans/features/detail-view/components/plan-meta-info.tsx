"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Tag } from "lucide-react";
import type { ActivityPlanWithRelations } from "../../../types";

interface PlanMetaInfoProps {
  plan: ActivityPlanWithRelations;
}

export function PlanMetaInfo({ plan }: PlanMetaInfoProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="h-3 w-3 text-indigo-500" />
          ข้อมูลแผนงาน
        </h4>
      </div>
      <div className="p-4 space-y-2 text-xs">
        {(plan.activityType as any)?.name && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 shrink-0">ประเภทงาน</span>
            <span className="font-semibold text-slate-800 text-right">
              {(plan.activityType as any).name}
            </span>
          </div>
        )}
        {(plan as any).fiscalYear && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 shrink-0">ปีงบประมาณ</span>
            <span className="font-semibold text-slate-800">
              {(plan as any).fiscalYear}
            </span>
          </div>
        )}
        {(plan as any).fiscalMonth && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 shrink-0">เดือนงบประมาณ</span>
            <span className="font-semibold text-slate-800">
              {(plan as any).fiscalMonth}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-500 shrink-0">วันที่จัดทำ</span>
          <span className="font-semibold text-slate-800">
            {format(new Date((plan as any).createdAt), "dd MMM yyyy", {
              locale: th,
            })}
          </span>
        </div>
        {plan.durationDays > 1 && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 shrink-0">จำนวนวัน</span>
            <span className="font-semibold text-slate-800">
              {plan.durationDays} วัน
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
