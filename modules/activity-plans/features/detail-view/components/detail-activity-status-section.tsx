"use client";

import React from "react";
import { BarChart3, CheckSquare, Calendar, X, Clock, AlertCircle } from "lucide-react";
import type { ActivityResultStatusType } from "../../actual-view/types";

interface DetailActivityStatusSectionProps {
  activityResultStatus?: ActivityResultStatusType;
  cancelReason?: string;
  postponedDate?: string;
  postponedTime?: string;
  postponedReason?: string;
  postponedNotes?: string;
}

export function DetailActivityStatusSection({
  activityResultStatus,
  cancelReason,
  postponedDate,
  postponedTime,
  postponedReason,
  postponedNotes,
}: DetailActivityStatusSectionProps) {
  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  const getStatusBadge = () => {
    switch (activityResultStatus) {
      case "COMPLETED":
        return (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">
                สถานะผลการทำกิจกรรม
              </span>
              <span className="text-sm font-extrabold text-emerald-950 block">
                สำเร็จ (Completed)
              </span>
            </div>
          </div>
        );
      case "PARTIAL":
        return (
          <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <span className="text-base">🏆</span>
            </div>
            <div>
              <span className="text-xs text-amber-600 font-bold uppercase tracking-wider block">
                สถานะผลการทำกิจกรรม
              </span>
              <span className="text-sm font-extrabold text-amber-950 block">
                สำเร็จบางส่วน (Partial)
              </span>
            </div>
          </div>
        );
      case "POSTPONED":
        return (
          <div className="flex items-center gap-2.5 p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-sky-600 font-bold uppercase tracking-wider block">
                สถานะผลการทำกิจกรรม
              </span>
              <span className="text-sm font-extrabold text-sky-950 block">
                เลื่อนกิจกรรม (Postponed)
              </span>
            </div>
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-rose-600 font-bold uppercase tracking-wider block">
                สถานะผลการทำกิจกรรม
              </span>
              <span className="text-sm font-extrabold text-rose-950 block">
                ยกเลิกกิจกรรม (Cancelled)
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                สถานะผลการทำกิจกรรม
              </span>
              <span className="text-sm font-bold text-slate-800 block">
                ยังไม่ได้บันทึกผลการปฏิบัติงาน
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xs">
        <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
        <h2 className="text-sm font-bold text-blue-900">
          สถานะผลการทำกิจกรรม
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        {getStatusBadge()}

        {/* DETAILS FOR CANCELLED */}
        {activityResultStatus === "CANCELLED" && cancelReason && (
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-rose-600 font-semibold block flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              เหตุผลในการยกเลิก
            </span>
            <p className="text-xs sm:text-sm font-medium text-rose-950 whitespace-pre-wrap leading-relaxed">
              {cancelReason}
            </p>
          </div>
        )}

        {/* DETAILS FOR POSTPONED */}
        {activityResultStatus === "POSTPONED" && (
          <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-slate-500 block mb-0.5">เลื่อนเป็นวันที่</span>
                <span className="text-sm font-bold text-sky-900">
                  {formatThaiDate(postponedDate)} {postponedTime ? `เวลา ${postponedTime} น.` : ""}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-slate-500 block mb-0.5">สาเหตุการเลื่อน</span>
                <span className="text-sm font-semibold text-slate-800">
                  {postponedReason || "-"}
                </span>
              </div>
            </div>

            {postponedNotes && (
              <div className="bg-white p-2.5 rounded-lg border border-sky-100 text-xs">
                <span className="text-slate-500 block mb-0.5">หมายเหตุเพิ่มเติม</span>
                <p className="text-slate-800 whitespace-pre-wrap font-medium">
                  {postponedNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
