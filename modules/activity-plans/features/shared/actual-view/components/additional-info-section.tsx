"use client";

import React from "react";
import { Info, MapPin, Users, UserCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanSummaryData } from "../types";

interface AdditionalInfoSectionProps {
  summary: PlanSummaryData;
}

export function AdditionalInfoSection({ summary }: AdditionalInfoSectionProps) {
  // 1. ตรวจสอบรายละเอียดพื้นที่จัดกิจกรรม
  const locationRaw = summary.location || summary.locationStr;
  const hasLocation =
    !!locationRaw &&
    locationRaw.trim() !== "" &&
    locationRaw.trim() !== "-" &&
    locationRaw.trim() !== "ไม่ระบุสถานที่";

  // 2. ตรวจสอบหมายเหตุเพิ่มเติม
  const hasNotes =
    !!summary.notes &&
    summary.notes.trim() !== "" &&
    summary.notes.trim() !== "-";

  // 3. ตรวจสอบและเตรียมข้อมูลผู้ช่วยงาน
  const helpers =
    summary.helpers && summary.helpers.length > 0
      ? summary.helpers
      : (summary.helperEmployeeNames || [])
          .filter(Boolean)
          .map((name, index) => ({
            id: `helper-${index}`,
            name,
          }));

  const hasHelpers = helpers.length > 0;
  const hasAdditionalInfo = hasLocation || hasNotes || hasHelpers;

  if (!hasAdditionalInfo) return null;

  const totalCards = (hasLocation ? 1 : 0) + (hasNotes ? 1 : 0) + (hasHelpers ? 1 : 0);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-sky-700">
        <Info className="w-4 h-4 shrink-0" />
        <span className="text-xs sm:text-sm font-bold">ข้อมูลเพิ่มเติม</span>
      </div>

      <div
        className={cn(
          "grid gap-3.5",
          totalCards > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* รายละเอียดพื้นที่จัดกิจกรรม */}
        {hasLocation && (
          <div
            className={cn(
              "bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs",
              totalCards === 3 ? "md:col-span-2" : "col-span-1",
            )}
          >
            <span className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              รายละเอียดพื้นที่จัดกิจกรรม
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-relaxed block whitespace-pre-line break-words">
              {locationRaw}
            </span>
            {(summary.district || summary.province) && (
              <span className="text-xs text-slate-400 mt-1.5 block">
                {[
                  summary.district ? `อ.${summary.district}` : "",
                  summary.province ? `จ.${summary.province}` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            )}
          </div>
        )}

        {/* หมายเหตุเพิ่มเติม */}
        {hasNotes && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <span className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              หมายเหตุเพิ่มเติม
            </span>
            <span className="text-sm font-semibold text-slate-700 leading-relaxed block whitespace-pre-line break-words">
              {summary.notes}
            </span>
          </div>
        )}

        {/* ผู้ช่วยงาน */}
        {hasHelpers && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
            <span className="text-xs text-slate-400 font-medium mb-1.5 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                ผู้ช่วยงาน
              </span>
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                {helpers.length} คน
              </span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {helpers.map((helper) => (
                <span
                  key={helper.id}
                  className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/70
                             text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium
                             transition-colors"
                >
                  <UserCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>{helper.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
