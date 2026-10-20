"use client";

import React from "react";
import { Sprout, MapPin, Users, Target, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Type10PlanTarget, Type10PlanCardProps } from "../types/planned.types";

export type { Type10PlanCardProps };

export function Type10PlanCard({
  target,
  planType = "PLANNED",
  className,
}: {
  target?: Type10PlanTarget;
  planType?: string;
  className?: string;
}) {
  if (!target) return null;

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              {target.plot || "งาน Field Day"}
            </h4>
            {target.crop && (
              <p className="text-[11px] text-slate-500 font-medium">
                พืช: {target.crop}
              </p>
            )}
          </div>
        </div>

        {planType === "UNPLANNED" && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            นอกแผน
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        {target.showcase && (
          <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 text-teal-800 font-semibold bg-teal-50/60 border border-teal-100 rounded-lg p-2">
            <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>สินค้าจัดแสดง: {target.showcase}</span>
          </div>
        )}

        {target.location && (
          <div className="flex items-start gap-1.5 col-span-1 sm:col-span-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{target.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            เป้าหมายผู้เข้าร่วม:{" "}
            <span className="font-bold text-slate-800">
              {target.targetAttendees || "-"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            เป้าหมายยอดจอง:{" "}
            <span className="font-bold text-emerald-700">
              {target.targetSales || "-"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
