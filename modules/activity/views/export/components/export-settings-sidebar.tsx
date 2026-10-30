"use client";

import React from "react";
import {
  Sliders,
  Layers,
  FileCheck,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  Compass,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  AvailableWorkTypeOption,
  PlanListOption,
} from "../hooks/use-activity-plan-export";

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

interface ExportSettingsSidebarProps {
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
  availablePlans: PlanListOption[];
  mode: "ALL" | "SINGLE";
  setMode: (mode: "ALL" | "SINGLE") => void;
  selectedMonth: number;
  setSelectedMonth: (val: number) => void;
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  selectedTypeCode: string;
  setSelectedTypeCode: (code: string) => void;
  availableWorkTypes: AvailableWorkTypeOption[];
  includeActual: boolean;
  setIncludeActual: (val: boolean) => void;
  includePhotos: boolean;
  setIncludePhotos: (val: boolean) => void;
  pageBreakPerType: boolean;
  setPageBreakPerType: (val: boolean) => void;
}

export function ExportSettingsSidebar({
  selectedPlanId,
  setSelectedPlanId,
  availablePlans,
  mode,
  setMode,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedTypeCode,
  setSelectedTypeCode,
  availableWorkTypes,
  includeActual,
  setIncludeActual,
  includePhotos,
  setIncludePhotos,
  pageBreakPerType,
  setPageBreakPerType,
}: ExportSettingsSidebarProps) {
  const currentYear = new Date().getFullYear();

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              ตั้งค่าการพิมพ์และส่งออก
            </h2>
            <p className="text-[11px] text-slate-500">
              กำหนดรูปแบบและขอบเขตเอกสาร
            </p>
          </div>
        </div>

        {/* 1. Print Mode Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>รูปแบบการพิมพ์เอกสาร</span>
          </label>

          <div className="space-y-3">
            {/* Mode Option 1: ALL (Monthly Itinerary Summary) */}
            <div
              onClick={() => setMode("ALL")}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                mode === "ALL"
                  ? "border-blue-500 bg-blue-50/40 text-blue-900 shadow-2xs font-semibold ring-1 ring-blue-500"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="exportMode"
                    checked={mode === "ALL"}
                    onChange={() => setMode("ALL")}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-bold">พิมพ์รวมทุกแผนงาน</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  แนวตั้ง (A4)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-5 font-normal">
                สรุปภาพรวมแผนงานตลอดเดือน: วันที่, ชื่อแผนงาน, พื้นที่เป้าหมาย, ร้านค้า/แปลงเกษตรกร และสถานะ
              </p>

              {/* Sub-options for Month and Year selection */}
              {mode === "ALL" && (
                <div
                  className="mt-3 pt-3 border-t border-blue-200/60 pl-5 space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        เลือกเดือน:
                      </label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {THAI_MONTHS.map((m, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        เลือกปี:
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                          <option key={y} value={y}>
                            พ.ศ. {y + 543} ({y})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-[10px] text-blue-700 bg-blue-100/60 rounded-lg p-2 font-medium flex items-start gap-1.5">
                    <Compass className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
                    <span>
                      ระบบจะรวบรวมแผนงานทั้งหมดในเดือนนี้ ออกเป็นรายงานตารางกำหนดการลงพื้นที่ (Monthly Itinerary)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mode Option 2: SINGLE (Specific Trip Plan or Job Sheet) */}
            <div
              onClick={() => setMode("SINGLE")}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                mode === "SINGLE"
                  ? "border-blue-500 bg-blue-50/40 text-blue-900 shadow-2xs font-semibold ring-1 ring-blue-500"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="exportMode"
                    checked={mode === "SINGLE"}
                    onChange={() => setMode("SINGLE")}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-bold">พิมพ์แยกเฉพาะแผนงาน</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full border border-slate-200">
                  แนวตั้ง (A4)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-5 font-normal">
                สร้างเป็นใบงานเฉพาะเรื่อง (Job Sheet) หรือรายงานรายละเอียดแผนงานฉบับเต็ม
              </p>

              {/* Sub-dropdowns when SINGLE is active */}
              {mode === "SINGLE" && (
                <div
                  className="mt-3 pt-3 border-t border-blue-200/60 pl-5 space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Select Plan */}
                  {availablePlans && availablePlans.length > 0 && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>เลือกแผนงาน (Trip Plan):</span>
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {availablePlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code ? `[${p.code}] ` : ""}
                            {p.title} ({p.creatorName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Select Specific Type */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      เลือกประเภทงานที่ต้องการพิมพ์:
                    </label>
                    <select
                      value={selectedTypeCode}
                      onChange={(e) => setSelectedTypeCode(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">
                        รวมทุกประเภทงานในแผนนี้ (Master Sheet)
                      </option>
                      {availableWorkTypes.map((t) => (
                        <option key={t.code} value={t.code}>
                          [{t.code}] {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Additional Options */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ตัวเลือกข้อมูลเพิ่มเติม</span>
          </label>

          <div className="space-y-2.5 pl-1">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <Checkbox
                checked={includeActual}
                onCheckedChange={(checked) =>
                  setIncludeActual(Boolean(checked))
                }
              />
              <span className="font-medium flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                รวมข้อมูลผลการปฏิบัติงานจริง (Actual Results)
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <Checkbox
                checked={includePhotos}
                onCheckedChange={(checked) =>
                  setIncludePhotos(Boolean(checked))
                }
                disabled={!includeActual}
              />
              <span
                className={`font-medium flex items-center gap-1 ${
                  !includeActual ? "text-slate-400" : ""
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-500 inline" />
                แนบแกลเลอรีรูปถ่ายผลการปฏิบัติงาน (Photos)
              </span>
            </label>

            {mode === "SINGLE" && (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <Checkbox
                  checked={pageBreakPerType}
                  onCheckedChange={(checked) =>
                    setPageBreakPerType(Boolean(checked))
                  }
                />
                <span className="font-medium">
                  ขึ้นหน้าใหม่เมื่อเริ่มแผนงานถัดไป (Page Break)
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
