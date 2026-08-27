"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { User, Calendar, MapPin, DollarSign } from "lucide-react";
import type { ActivityPlanWithRelations } from "../../../types";

interface DetailOverviewProps {
  plan: ActivityPlanWithRelations;
}

export function DetailOverview({ plan }: DetailOverviewProps) {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);

  const salesPromoVal = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketingVal = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromoVal + marketingVal;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Creator */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            ผู้จัดทำ
          </p>
          <p className="text-sm font-bold text-slate-900 truncate">
            {plan.employee.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {plan.employee.positionTitle ||
              plan.employee.departmentName ||
              "พนักงาน"}
          </p>
        </div>
      </div>

      {/* Card 2: Date */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            วันที่ ({plan.durationDays} วัน)
          </p>
          <p className="text-sm font-bold text-slate-900 truncate">
            {format(start, "dd MMM yyyy", { locale: th })}
          </p>
          <p className="text-[11px] text-slate-500">
            {format(start, "HH:mm")} - {format(end, "HH:mm")} น.
          </p>
        </div>
      </div>

      {/* Card 3: Location */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            สถานที่
          </p>
          <p
            className="text-sm font-bold text-slate-900 truncate"
            title={plan.location}
          >
            {plan.location}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {[
              plan.district ? `อ.${plan.district}` : "",
              plan.province ? `จ.${plan.province}` : "",
            ]
              .filter(Boolean)
              .join(" ") || "-"}
          </p>
        </div>
      </div>

      {/* Card 4: Budget */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
          <DollarSign className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            งบประมาณ
          </p>
          <p className="text-sm font-bold text-slate-900">
            {budgetTotal > 0
              ? `${budgetTotal.toLocaleString()} ฿`
              : "ไม่มีงบประมาณ"}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {salesPromoVal > 0
              ? `SP: ${salesPromoVal.toLocaleString()}฿`
              : ""}{" "}
            {marketingVal > 0 ? `MKT: ${marketingVal.toLocaleString()}฿` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
