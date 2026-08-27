"use client";

import React from "react";
import { BarChart3, CheckSquare, Calendar, X, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "../../form/components/date-time-picker";
import { cn } from "@/lib/utils";
import type { ActivityResultStatusType } from "../types";

interface ActivityStatusSectionProps {
  activityResultStatus: ActivityResultStatusType;
  setActivityResultStatus: (s: ActivityResultStatusType) => void;
  cancelReason: string;
  setCancelReason: (s: string) => void;
  postponedDate: string;
  setPostponedDate: (s: string) => void;
  postponedTime: string;
  setPostponedTime: (s: string) => void;
  postponedReason: string;
  setPostponedReason: (s: string) => void;
  postponedNotes: string;
  setPostponedNotes: (s: string) => void;
}

export function ActivityStatusSection({
  activityResultStatus,
  setActivityResultStatus,
  cancelReason,
  setCancelReason,
  postponedDate,
  setPostponedDate,
  postponedTime,
  setPostponedTime,
  postponedReason,
  setPostponedReason,
  postponedNotes,
  setPostponedNotes,
}: ActivityStatusSectionProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xs">
        <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
        <h2 className="text-sm font-bold text-blue-900">
          สถานะผลการทำกิจกรรม
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>
                เลือกผลการทำกิจกรรม <span className="text-rose-500">*</span>
              </span>
            </label>
            <span className="text-xs text-slate-400 font-normal">
              (กำหนดสถานะการดำเนินงานของกิจกรรมนี้)
            </span>
          </div>

          {/* Status Radio / Selectable Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: "PARTIAL" as const,
                label: (
                  <div className="text-center leading-tight">
                    <div>สำเร็จบางส่วน</div>
                  </div>
                ),
                icon: <span className="text-base">🏆</span>,
                activeClass:
                  "bg-amber-50/90 border-amber-400 text-amber-950 ring-1 ring-amber-400/50 shadow-2xs",
              },
              {
                id: "COMPLETED" as const,
                label: <span>สำเร็จ</span>,
                icon: <CheckSquare className="w-4 h-4 text-emerald-600" />,
                activeClass:
                  "bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/50 shadow-2xs",
              },
              {
                id: "POSTPONED" as const,
                label: <span>เลื่อน</span>,
                icon: <Calendar className="w-4 h-4 text-sky-600" />,
                activeClass:
                  "bg-sky-50/90 border-sky-500 text-sky-950 ring-1 ring-sky-500/50 shadow-2xs",
              },
              {
                id: "CANCELLED" as const,
                label: <span>ยกเลิก</span>,
                icon: <X className="w-4 h-4 text-rose-600" />,
                activeClass:
                  "bg-rose-50/90 border-rose-500 text-rose-950 ring-1 ring-rose-500/50 shadow-2xs",
              },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActivityResultStatus(st.id)}
                className={cn(
                  "py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2",
                  activityResultStatus === st.id
                    ? st.activeClass
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
                )}
              >
                {st.icon}
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* กรณีเลือก ยกเลิก (CANCELLED) */}
        {activityResultStatus === "CANCELLED" && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 sm:p-4 space-y-2 animate-in fade-in-50">
            <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <span>⚠️</span> สาเหตุที่ยกเลิก{" "}
              <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ระบุสาเหตุที่ต้องยกเลิกกิจกรรม..."
              className="bg-white border-rose-200 text-xs sm:text-sm"
            />
          </div>
        )}

        {/* กรณีเลือก เลื่อน (POSTPONED) */}
        {activityResultStatus === "POSTPONED" && (
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 sm:p-4 space-y-3.5 animate-in fade-in-50">
            <div>
              <DateTimePicker
                label="วันที่ใหม่"
                required
                dateValue={postponedDate}
                timeValue={postponedTime || "10:00"}
                onDateChange={setPostponedDate}
                onTimeChange={setPostponedTime}
                accentColor="blue"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-900 flex items-center gap-1">
                <span>📌</span> เหตุผลที่เลื่อน{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "ลูกค้าขอเลื่อน",
                  "ผู้ปฏิบัติงานขอเลื่อน",
                  "ลูกค้าไม่สะดวก",
                  "สภาพอากาศ",
                  "เหตุสุดวิสัย",
                  "อื่น ๆ",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setPostponedReason(reason)}
                    className={cn(
                      "py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all text-left flex items-center justify-between",
                      postponedReason === reason
                        ? "bg-sky-600 text-white border-sky-600 shadow-2xs font-semibold"
                        : "bg-white border-sky-200/80 text-sky-950 hover:bg-sky-100/60",
                    )}
                  >
                    <span>{reason}</span>
                    {postponedReason === reason && (
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-900 flex items-center gap-1">
                <span>📝</span> ช่องกรอกหมายเหตุ
              </label>
              <Textarea
                rows={2}
                value={postponedNotes}
                onChange={(e) => setPostponedNotes(e.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติมกรณีเลื่อนกิจกรรม (ถ้ามี)..."
                className="bg-white border-sky-200 text-xs sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
