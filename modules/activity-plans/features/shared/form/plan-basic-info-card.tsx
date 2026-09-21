import React from "react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/custom/section-header";
import { DateTimePicker } from "./components/date-time-picker";
import {
  AlertCircle,
  RotateCcw,
  XCircle,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface PlanBasicInfoCardProps {
  isEdit?: boolean;
  readonly?: boolean;
  initial?: any;
  error?: string | null;
  latestCorrectionLog?: any;
  title: string;
  setTitle: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  workTypeSelectorNode: React.ReactNode;
}

export function PlanBasicInfoCard({
  isEdit = false,
  readonly = false,
  initial = {},
  error,
  latestCorrectionLog,
  title,
  setTitle,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  workTypeSelectorNode,
}: PlanBasicInfoCardProps) {
  return (
    <>
      <div className="text-center">
        <h5 className="font-semibold text-lg sm:text-2xl md:text-3xl border-b pb-4 md:pb-6 leading-snug">
          <span className="hidden sm:inline">
            {isEdit
              ? "แก้ไขแผนงาน ( Trip Plan )"
              : "สร้างแผนงาน ( Trip Plan )"}
          </span>
          <span className="inline sm:hidden">
            {isEdit ? "แก้ไขแผนงาน" : "สร้างแผนงาน"}
            <br />( Trip Plan )
          </span>
        </h5>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ALERT: เหตุผลที่ส่งกลับแก้ไข / ปฏิเสธ (Read-only) */}
      {latestCorrectionLog && (
        <div
          className={cn(
            "rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs border",
            latestCorrectionLog.action === "REQUEST_CORRECTION"
              ? "bg-amber-50/90 border-amber-200 text-amber-900"
              : "bg-red-50/90 border-red-200 text-red-900",
          )}
        >
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base border-b pb-2.5 border-amber-200/60">
            {latestCorrectionLog.action === "REQUEST_CORRECTION" ? (
              <>
                <RotateCcw className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <span className="text-amber-950 font-bold">
                  เหตุผลที่ส่งกลับแก้ไข
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                <span className="text-red-950 font-bold">
                  เหตุผลที่ปฏิเสธ
                </span>
              </>
            )}
          </div>
          <div className="bg-white/95 rounded-xl p-3.5 sm:p-4 border border-amber-100/80 space-y-3 shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {latestCorrectionLog.comment || "-"}
            </p>
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                ผู้ตรวจสอบ:{" "}
                <span className="font-semibold text-slate-800">
                  {latestCorrectionLog.user?.name || "ผู้อนุมัติ"}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                วันที่:{" "}
                {format(
                  new Date(latestCorrectionLog.createdAt),
                  "dd/MM/yyyy HH:mm",
                  { locale: th },
                )}{" "}
                น.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: ข้อมูลระบบ (System Info) */}
      <SectionHeader
        title="ข้อมูลระบบ"
        className="rounded-xl"
        accentColor="#808080"
      />

      <div
        className={cn(
          "grid grid-cols-1 gap-3 md:gap-4",
          isEdit && "sm:grid-cols-2",
        )}
      >
        {/* Card 1: ผู้รับผิดชอบ */}
        <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">ผู้รับผิดชอบ </p>
            <p className="text-sm font-semibold text-slate-800">
              {initial.employeeName || "ผู้ใช้งานปัจจุบัน"}
            </p>
          </div>
        </div>

        {/* Card 2: เลขที่แผน */}
        {isEdit && (
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">เลขที่แผน </p>
              <p className="text-sm font-semibold text-slate-800">
                {initial.planCode || (initial as any).code}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: ข้อมูลหลักของกิจกรรม (Main Activity Details) */}
      <SectionHeader
        title="ข้อมูลหลักของกิจกรรม"
        className="rounded-xl"
        accentColor="#808080"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {/* ชื่อกิจกรรม */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            ชื่อกิจกรรม <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readonly}
            placeholder="เช่น กิจกรรมส่งเสริมการขายตราปืนใหญ่"
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Work Type Selector Node */}
        {workTypeSelectorNode}

        {/* วันที่เริ่ม */}
        <DateTimePicker
          label="วันที่เริ่ม"
          required
          dateValue={startDate}
          timeValue={startTime}
          onDateChange={setStartDate}
          onTimeChange={setStartTime}
          readonly={readonly}
          accentColor="blue"
        />

        {/* วันที่สิ้นสุด */}
        <DateTimePicker
          label="วันที่สิ้นสุด"
          required
          dateValue={endDate}
          timeValue={endTime}
          onDateChange={setEndDate}
          onTimeChange={setEndTime}
          readonly={readonly}
          accentColor="blue"
        />
      </div>
    </>
  );
}
