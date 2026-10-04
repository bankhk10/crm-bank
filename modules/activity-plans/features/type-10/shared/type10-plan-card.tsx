"use client";

import React from "react";
import { Flag, MapPin, Users, Target, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Type10PlanTarget {
  plot?: string;
  location?: string;
  showcase?: string;
  targetAttendees?: number | string;
  targetSales?: number | string;
  [key: string]: any;
}

export interface Type10PlanCardProps {
  target?: Type10PlanTarget;
  planType?: string;
  className?: string;
}

export function Type10PlanCard({
  target,
  planType,
  className = "",
}: Type10PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  return (
    <div
      className={`bg-white border border-cyan-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-200">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-cyan-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: จัดงาน Field Day
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-cyan-50 text-cyan-800 border-cyan-200 text-[11px] font-semibold px-2.5 py-0.5"
        >
          ข้อมูลตามแผนงาน (PLAN)
        </Badge>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {target.plot ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              แปลงสาธิต
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.plot}
            </span>
          </div>
        ) : null}

        {target.location ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              สถานที่จัดงาน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.location}
            </span>
          </div>
        ) : null}

        {target.showcase ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              จุดเด่นแปลง / สินค้าที่จัดแสดง
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.showcase}
            </span>
          </div>
        ) : null}

        {target.targetAttendees ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              เป้าหมายผู้เข้าร่วม
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.targetAttendees} คน
            </span>
          </div>
        ) : null}

        {target.targetSales ? (
          <div className="bg-cyan-50/40 p-3 rounded-xl border border-cyan-100/80">
            <span className="text-cyan-700 block text-[11px] font-bold mb-1">
              เป้ายอดขาย/จอง
            </span>
            <span className="font-extrabold text-cyan-900 block text-xs sm:text-sm">
              {typeof target.targetSales === "number"
                ? `฿${target.targetSales.toLocaleString()}`
                : String(target.targetSales).startsWith("฿")
                  ? target.targetSales
                  : `฿${target.targetSales}`}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
