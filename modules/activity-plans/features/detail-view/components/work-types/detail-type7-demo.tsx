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
  Camera,
  Eye,
  MapPin,
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
  plannedProductId?: string | null;
  actualProductId?: string | null;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
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
  plannedProductId,
  actualProductId,
  plannedProductName,
  actualProductName,
  changeReason,
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

  if (!isVisible) return null;

  const isFollowUp =
    target.activityType === "FOLLOW_UP" ||
    (target.owner && target.owner.startsWith("plot-"));

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
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-950 text-base md:text-lg">
              ติดตามแปลงสาธิต / ทำแปลง
            </h2>
            <span className="text-xs text-emerald-700 font-medium">
              {isFollowUp ? "บันทึกผลการติดตามแปลงสาธิต" : "บันทึกผลการจัดทำแปลงสาธิตใหม่"}
            </span>
          </div>
        </div>

        {demoPlotData && visitHistory.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="h-8 gap-1.5 text-xs font-semibold text-emerald-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl"
          >
            <History className="w-3.5 h-3.5" />
            <span>ดูประวัติการติดตาม ({visitHistory.length} ครั้ง)</span>
          </Button>
        )}
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-emerald-700"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          {
            label: "ประเภทงาน:",
            value: isFollowUp ? "ติดตามแปลงเดิม" : "ทำแปลงสาธิตใหม่",
          },
          { label: "เกษตรกร/แปลง:", value: target.owner || "-" },
          { label: "พืชที่ทดสอบ:", value: target.crop || "-" },
          { label: "สินค้าที่ใช้:", value: target.product || "-" },
          { label: "จำนวนแปลง/พื้นที่:", value: target.plots || "-" },
          {
            label: "จำนวนสินค้าที่ใช้:",
            value: target.demoProductQuantity
              ? `${target.demoProductQuantity} ชิ้น/ขวด`
              : "-",
          },
          {
            label: "สภาพแปลงเป้าหมาย:",
            value: target.targetCondition || target.objective || "-",
          },
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail || "-",
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>ผลการปฏิบัติงานจริงในแปลงสาธิต</span>
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
              วันที่เริ่มปลูก / อายุพืช
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {cropAgeValue
                ? `${cropAgeValue} ${cropAgeUnit}`
                : plantingDate
                  ? formatThaiDate(plantingDate)
                  : "-"}
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
              สภาพแปลง / พื้นที่ปลูก
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {plantingAreaCondition || "-"}
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

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ใช้สาธิตจริง (Actual Product)
              </span>
              {(Boolean(
                (actualProductId &&
                  plannedProductId &&
                  actualProductId !== plannedProductId) ||
                  (actualProductName &&
                    plannedProductName &&
                    actualProductName !== plannedProductName) ||
                  (changeReason && changeReason.trim().length > 0),
              )) && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 font-bold gap-1 text-[11px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ⚠️ เปลี่ยนหน้างาน
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {actualProductName || target.product || "-"}
              </span>
              {Boolean(
                (actualProductId &&
                  plannedProductId &&
                  actualProductId !== plannedProductId) ||
                  (actualProductName &&
                    plannedProductName &&
                    actualProductName !== plannedProductName) ||
                  (changeReason && changeReason.trim().length > 0),
              ) && (
                <span className="text-xs text-slate-400">
                  (สินค้าตามแผน:{" "}
                  <span className="line-through">
                    {plannedProductName || target.product}
                  </span>
                  )
                </span>
              )}
            </div>

            {changeReason && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-900">
                <span className="font-semibold text-amber-800">
                  เหตุผลที่เปลี่ยนหน้างาน:{" "}
                </span>
                <span>{changeReason}</span>
              </div>
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

        {/* IMAGES DISPLAY (READ-ONLY LIGHTBOX) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* 1. Crop Images */}
          <div className="bg-emerald-50/20 border border-emerald-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                ภาพถ่ายสภาพพืช
              </span>
              {cropImages && cropImages.length > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {cropImages.length} รูป
                </span>
              ) : null}
            </div>

            {cropImages && cropImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {cropImages.map((img, imgIdx) => (
                  <button
                    key={img.id || imgIdx}
                    type="button"
                    onClick={() =>
                      openLightbox(
                        `ภาพถ่ายสภาพพืช - ${plotName || target.owner || "แปลงสาธิต"}`,
                        cropImages,
                        imgIdx,
                      )
                    }
                    className="group relative rounded-xl border border-emerald-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    aria-label={`คลิกเพื่อดูภาพถ่ายสภาพพืชที่ ${imgIdx + 1} ขนาดใหญ่`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name || `ภาพถ่ายพืช ${imgIdx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                <ImageIcon className="w-4 h-4 opacity-50 text-slate-400" />
                <span>ไม่มีภาพถ่ายสภาพพืช</span>
              </div>
            )}
          </div>

          {/* 2. Plot Images */}
          <div className="bg-teal-50/20 border border-teal-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3">
            <div className="flex items-center justify-between border-b border-teal-100/80 pb-2">
              <span className="text-xs sm:text-sm font-bold text-teal-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                ภาพถ่ายสภาพแปลง
              </span>
              {plotImages && plotImages.length > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  {plotImages.length} รูป
                </span>
              ) : null}
            </div>

            {plotImages && plotImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {plotImages.map((img, imgIdx) => (
                  <button
                    key={img.id || imgIdx}
                    type="button"
                    onClick={() =>
                      openLightbox(
                        `ภาพถ่ายสภาพแปลง - ${plotName || target.owner || "แปลงสาธิต"}`,
                        plotImages,
                        imgIdx,
                      )
                    }
                    className="group relative rounded-xl border border-teal-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    aria-label={`คลิกเพื่อดูภาพถ่ายสภาพแปลงที่ ${imgIdx + 1} ขนาดใหญ่`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name || `ภาพถ่ายแปลง ${imgIdx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                <ImageIcon className="w-4 h-4 opacity-50 text-slate-400" />
                <span>ไม่มีภาพถ่ายสภาพแปลง</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEMO PLOT HISTORY MODAL (READ-ONLY) */}
      {historyOpen && demoPlotData && (
        <DemoPlotHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          plot={{ ...demoPlotData, visits: visitHistory, status: plotStatus || demoPlotData?.status }}
        />
      )}

      {/* Lightbox Viewer */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        title={lightboxState.title}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
      />
    </div>
  );
}
