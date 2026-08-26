"use client";

import React, { useState } from "react";
import {
  Sprout,
  Calendar,
  History,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  Star,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import { DemoPlotHistoryModal } from "@/modules/activity-plans/features/actual-view/components/work-types/demo-plot-history-modal";

interface DetailType7DemoProps {
  isVisible: boolean;
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: any[];
  };
  startDate?: string;
  plotName?: string;
  usageMethod?: string;
  plantingDate?: string;
  plantingAreaCondition?: string;
  cropAgeValue?: string;
  cropAgeUnit?: string;
  growthStage?: string;
  cropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  cropProblemDescription?: string;
  productResponse?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDescription?: string;
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  nextFollowUpDate?: string;
  finalYieldKg?: string;
  controlYieldKg?: string;
  yieldIncreasePercent?: string;
  farmerSatisfaction?: number;
  commercialPotential?: string;
  finalSummaryNotes?: string;
  cropImages?: ImageFile[];
  plotImages?: ImageFile[];
  visitHistory?: any[];
  demoPlotData?: any;
}

export function DetailType7Demo({
  isVisible,
  target,
  plotName,
  usageMethod,
  plantingDate,
  plantingAreaCondition,
  cropAgeValue,
  cropAgeUnit = "วัน",
  growthStage,
  cropCondition,
  cropProblemDescription,
  productResponse,
  problemDescription,
  plotStatus = "IN_PROGRESS",
  nextFollowUpDate,
  finalYieldKg,
  controlYieldKg,
  yieldIncreasePercent,
  farmerSatisfaction = 5,
  commercialPotential,
  finalSummaryNotes,
  cropImages = [],
  plotImages = [],
  visitHistory = [],
  demoPlotData,
}: DetailType7DemoProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!isVisible) return null;

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  const allImages = [...cropImages, ...plotImages];

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Sprout className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-emerald-900 text-base md:text-lg">
            ติดตามแปลงสาธิต / ทำแปลง
          </h2>
        </div>

        {demoPlotData && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 gap-1.5 h-8"
          >
            <History className="w-3.5 h-3.5" />
            ประวัติการลงแปลง ({visitHistory.length} ครั้ง)
          </Button>
        )}
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-emerald-600"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "เจ้าของแปลง:", value: target.owner || "-" },
          { label: "สินค้าที่ใช้ทดสอบ:", value: target.product || "-" },
          { label: "พืช / พันธุ์:", value: target.crop || "-" },
          { label: "จำนวนแปลง / พื้นที่:", value: target.plots || "-" },
          {
            label: "จำนวนยาที่ใช้:",
            value: target.demoProductQuantity ? String(target.demoProductQuantity) : "-",
          },
          { label: "วัตถุประสงค์:", value: target.objective || "-" },
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail || "-",
            colSpan: "sm:col-span-2",
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ผลการติดตามแปลงสาธิตจริง</span>
          </div>

          <Badge
            variant="outline"
            className={
              plotStatus === "COMPLETED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                : plotStatus === "FAILED"
                  ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                  : "bg-blue-50 text-blue-800 border-blue-300 font-bold"
            }
          >
            {plotStatus === "COMPLETED"
              ? "จบการทดลองแล้ว"
              : plotStatus === "FAILED"
                ? "การทดลองล้มเหลว"
                : "กำลังดำเนินการ (In Progress)"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ชื่อแปลงสาธิต
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {plotName || "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              วันที่ปลูก
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {formatThaiDate(plantingDate)}
            </span>
          </div>

          {plantingAreaCondition && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                สภาพพื้นที่แปลง
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {plantingAreaCondition}
              </span>
            </div>
          )}

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              อายุพืช
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {cropAgeValue ? `${cropAgeValue} ${cropAgeUnit}` : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ระยะการเจริญเติบโต
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {growthStage || "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สภาพความสมบูรณ์ของพืช
            </span>
            {cropCondition ? (
              <Badge
                variant="outline"
                className={
                  cropCondition === "สมบูรณ์"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                    : cropCondition === "มีปัญหา" || cropCondition === "ทรุดโทรม"
                      ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                      : "bg-amber-50 text-amber-800 border-amber-300 font-bold"
                }
              >
                {cropCondition}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              การตอบสนองต่อผลิตภัณฑ์
            </span>
            {productResponse ? (
              <Badge
                variant="outline"
                className={
                  productResponse === "พืชตอบสนองดี"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                    : "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                }
              >
                {productResponse === "พืชตอบสนองดี" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                )}
                {productResponse}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              วิธีการใช้สาร / สูตรยา
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {usageMethod || "-"}
            </p>
          </div>

          {cropProblemDescription && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-rose-600 font-medium block">
                ปัญหาของพืชที่พบ
              </span>
              <p className="text-xs sm:text-sm text-rose-900 font-semibold whitespace-pre-wrap leading-relaxed">
                {cropProblemDescription}
              </p>
            </div>
          )}

          {problemDescription && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-rose-600 font-medium block">
                ปัญหาที่พบจากผลิตภัณฑ์
              </span>
              <p className="text-xs sm:text-sm text-rose-900 font-semibold whitespace-pre-wrap leading-relaxed">
                {problemDescription}
              </p>
            </div>
          )}

          {nextFollowUpDate && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                วันที่นัดติดตามครั้งถัดไป
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-800 block">
                {formatThaiDate(nextFollowUpDate)}
              </span>
            </div>
          )}
        </div>

        {/* FINAL HARVEST & SATISFACTION METRICS (IF COMPLETED) */}
        {(finalYieldKg || yieldIncreasePercent || commercialPotential || finalSummaryNotes) && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              สรุปผลผลิตและความพึงพอใจเมื่อจบการทดลอง
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ผลผลิตแปลงสาธิต</span>
                <span className="text-sm font-extrabold text-emerald-900">
                  {finalYieldKg ? `${Number(finalYieldKg).toLocaleString()} กก.` : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ผลผลิตแปลงควบคุม</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {controlYieldKg ? `${Number(controlYieldKg).toLocaleString()} กก.` : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">% ผลผลิตที่เพิ่มขึ้น</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {yieldIncreasePercent ? `+${yieldIncreasePercent}%` : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ความพึงพอใจ</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{farmerSatisfaction} / 5</span>
                </div>
              </div>

              {commercialPotential && (
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs sm:col-span-2 md:col-span-4">
                  <span className="text-slate-500 block mb-0.5">ศักยภาพทางการค้า</span>
                  <span className="font-semibold text-slate-800">{commercialPotential}</span>
                </div>
              )}

              {finalSummaryNotes && (
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs sm:col-span-2 md:col-span-4">
                  <span className="text-slate-500 block mb-0.5">สรุปผลการทดลอง</span>
                  <p className="font-semibold text-slate-800 whitespace-pre-wrap">{finalSummaryNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IMAGES (READ-ONLY) */}
        {allImages.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              ภาพถ่ายแปลงสาธิต / พืช
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {allImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Plot Image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DEMO PLOT HISTORY MODAL (READ-ONLY) */}
      {historyOpen && demoPlotData && (
        <DemoPlotHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          plot={{ ...demoPlotData, visits: visitHistory }}
        />
      )}
    </div>
  );
}
