"use client";

import React from "react";
import { FileText, Calendar, Clock, MapPin, Sprout, Target, Users } from "lucide-react";
import { PlanSummaryData } from "../types";

interface ActualPlanSummaryProps {
  summary: PlanSummaryData;
}

export function ActualPlanSummary({ summary }: ActualPlanSummaryProps) {
  return (
    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs shadow-xs">
            <FileText className="w-4 h-4" />
          </span>
          <span>ข้อมูลสรุปจากแผน (Plan Summary)</span>
        </div>
        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
          🎯 ดึงข้อมูลจาก Create Trip Plan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-blue-100/80">
          <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
            ชื่องานกิจกรรม
          </p>
          <p className="text-xs md:text-sm font-bold text-slate-900">
            {summary.title}
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-100/80">
          <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
            วันเวลาจัดงาน
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{summary.dateStr}</span>
            <span className="text-slate-400 font-normal">
              ({summary.timeStr})
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-100/80">
          <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
            สถานที่
          </p>
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{summary.locationStr}</span>
          </p>
        </div>
      </div>

      {/* Planned Target Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-white border border-emerald-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Sprout className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              เป้าหมายแปลงสาธิต
            </p>
            <p className="text-xs md:text-sm font-bold text-slate-900">
              {summary.demoPlotTarget}
            </p>
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              เป้ายอดขายที่ตั้งไว้
            </p>
            <p className="text-xs md:text-sm font-bold text-slate-900">
              {summary.salesTarget}
            </p>
          </div>
        </div>

        <div className="bg-white border border-violet-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              เป้าผู้เข้าร่วมงาน
            </p>
            <p className="text-xs md:text-sm font-bold text-slate-900">
              {summary.attendeeTarget}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
