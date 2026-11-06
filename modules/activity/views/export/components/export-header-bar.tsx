"use client";

import React from "react";
import { ArrowLeft, Printer, Download, RotateCw, Loader2, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityPlanWithRelations } from "@/modules/activity/types";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

interface ExportHeaderBarProps {
  plan: ActivityPlanWithRelations | null;
  mode: "ALL" | "SINGLE";
  selectedMonth: number;
  selectedYear: number;
  loadingPreview: boolean;
  downloadingPdf: boolean;
  onBack: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onRefreshPreview: () => void;
}

export function ExportHeaderBar({
  plan,
  mode,
  selectedMonth,
  selectedYear,
  loadingPreview,
  downloadingPdf,
  onBack,
  onPrint,
  onDownloadPdf,
  onRefreshPreview,
}: ExportHeaderBarProps) {
  const planCode = plan?.code || plan?.id || "-";
  const monthName = THAI_MONTHS[selectedMonth - 1] || `เดือนที่ ${selectedMonth}`;
  const thaiYear = selectedYear + 543;

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-2xs sticky top-0 z-20">
      <div className="container mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Back & Plan Title */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">ย้อนกลับ</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              {mode === "ALL" ? (
                <CalendarDays className="w-4 h-4 text-blue-600" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-800 tracking-tight">
                  {mode === "ALL"
                    ? "รายงานสรุปแผนงานประจำเดือน"
                    : "พิมพ์และส่งออกเอกสารแผนงาน"}
                </h1>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {mode === "ALL" ? `${monthName} ${thaiYear}` : planCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[280px] sm:max-w-[420px]">
                {mode === "ALL"
                  ? "ตารางสรุปแผนงานลงพื้นที่ตลอดเดือน (Monthly Field Activity Itinerary)"
                  : plan?.title || "กำลังโหลด..."}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshPreview}
            disabled={loadingPreview}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium h-9 gap-1.5 cursor-pointer shadow-2xs"
            title="รีเฟรชตัวอย่าง"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingPreview ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">รีเฟรช</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={loadingPreview}
            className="rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 text-xs font-bold h-9 gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>สั่งพิมพ์ (Print)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onDownloadPdf}
            disabled={downloadingPdf || loadingPreview}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 gap-1.5 cursor-pointer shadow-xs"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloadingPdf ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
