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
  Eye,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import { DemoPlotHistoryModal } from "@/modules/activity-plans/features/actual-view/components/work-types/demo-plot-history-modal";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface DetailType7FollowUpProps {
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
  plotName?: string;
  usageMethod?: string;
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

export function DetailType7FollowUp({
  target,
  plotName,
  usageMethod,
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
}: DetailType7FollowUpProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    title: string;
    images: LightboxImage[];
    initialIndex: number;
  }>({
    isOpen: false,
    title: "",
    images: [],
    initialIndex: 0,
  });

  const openLightbox = (
    title: string,
    imgs: ImageFile[] = [],
    initialIndex: number = 0,
  ) => {
    if (!imgs || imgs.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: imgs.map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name,
      })),
      initialIndex,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const formatThaiDate = (d?: string | Date | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-blue-950 text-base md:text-lg">
              ติดตามแปลงสาธิต (Follow-up Demo Plot)
            </h2>
            <span className="text-xs text-blue-700 font-medium">
              บันทึกผลการตรวจติดตามแปลงเดิม ติดตามการเจริญเติบโต และประเมินผลการใช้ผลิตภัณฑ์
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-blue-50 text-blue-800 border border-blue-200">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>ประเภท: ติดตามแปลงสาธิต</span>
          </span>

          {demoPlotData && visitHistory.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="h-8 gap-1.5 text-xs font-semibold text-blue-800 border-blue-300 bg-blue-50/50 hover:bg-blue-100 rounded-xl"
            >
              <History className="w-3.5 h-3.5" />
              <span>ดูประวัติการติดตาม ({visitHistory.length} ครั้ง)</span>
            </Button>
          )}
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-blue-700"
        badgeColorClass="bg-blue-50 text-blue-800 border border-blue-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ประเภทงาน:", value: "ติดตามแปลงสาธิต" },
          { label: "แปลงสาธิต / เกษตรกร:", value: target.owner || "-" },
          { label: "พืชที่ติดตาม:", value: target.crop || "-" },
          { label: "สินค้าสาธิตของแปลง:", value: target.product || "-" },
          { label: "ขนาดแปลง:", value: target.plots || "-" },
          {
            label: "เป้าหมายการติดตาม:",
            value: target.targetCondition || target.objective || "-",
          },
          {
            label: "สิ่งที่ตั้งใจไปติดตาม:",
            value: target.experimentDetail || target.detail || "-",
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>ผลการตรวจติดตามแปลงสาธิต</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ชื่อแปลงสาธิต / รหัสแปลง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {plotName || target.owner || "-"}
            </span>
          </div>

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
                {cropCondition === "สมบูรณ์" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                )}
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

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะแปลง
            </span>
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
                ? "✅ ปิดแปลงแล้ว"
                : plotStatus === "FAILED"
                  ? "❌ ยุติการทดลอง"
                  : "🔄 กำลังทดลอง"}
            </Badge>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              วิธีการใช้สาร / สูตรยาในรอบนี้
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
              <span className="text-xs sm:text-sm font-bold text-blue-800 block">
                {formatThaiDate(nextFollowUpDate)}
              </span>
            </div>
          )}
        </div>

        {/* FINAL HARVEST & SATISFACTION METRICS (IF COMPLETED) */}
        {(finalYieldKg ||
          yieldIncreasePercent ||
          commercialPotential ||
          finalSummaryNotes) && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              สรุปผลผลิตและความพึงพอใจเมื่อจบการทดลอง
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ผลผลิตแปลงสาธิต</span>
                <span className="text-sm font-extrabold text-emerald-900">
                  {finalYieldKg
                    ? `${Number(finalYieldKg).toLocaleString()} กก.`
                    : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ผลผลิตแปลงควบคุม</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {controlYieldKg
                    ? `${Number(controlYieldKg).toLocaleString()} กก.`
                    : "-"}
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
                  <span className="font-semibold text-slate-800">
                    {commercialPotential}
                  </span>
                </div>
              )}

              {finalSummaryNotes && (
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs sm:col-span-2 md:col-span-4">
                  <span className="text-slate-500 block mb-0.5">สรุปผลการทดลอง</span>
                  <p className="font-semibold text-slate-800 whitespace-pre-wrap">
                    {finalSummaryNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEMO PHOTOS (CROP & PLOT IMAGES) */}
        {(cropImages.length > 0 || plotImages.length > 0) && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              ภาพถ่ายการติดตามแปลง (Inspection Photos)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cropImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    ภาพถ่ายสภาพพืชรอบนี้ ({cropImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cropImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("ภาพถ่ายสภาพพืชรอบนี้", cropImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={img.url}
                          alt={img.name || `ภาพสภาพพืชที่ ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {plotImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    ภาพถ่ายสภาพแปลงโดยรวม ({plotImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {plotImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("ภาพถ่ายสภาพแปลงโดยรวม", plotImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={img.url}
                          alt={img.name || `ภาพสภาพแปลงที่ ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {demoPlotData && (
        <DemoPlotHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          plot={demoPlotData}
        />
      )}

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
        title={lightboxState.title}
      />
    </div>
  );
}
