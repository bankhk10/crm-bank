"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  ExternalLink,
  Sprout,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Camera,
  Award,
  TrendingUp,
  Star,
  ChevronRight,
  Plus,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import {
  extractPlotFollowUpTimeline,
  type PlotFollowUpTimelineResult,
  type PlotFollowUpItem,
  type PlotFollowUpPhoto,
} from "../application/follow-up-mapper";

function formatThaiDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs px-2.5 py-0.5">
          ปิดแปลงสาธิตแล้ว (COMPLETED)
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold text-xs px-2.5 py-0.5">
          ยกเลิกแปลง (CANCELLED)
        </Badge>
      );
    case "IN_PROGRESS":
    default:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-xs px-2.5 py-0.5">
          กำลังติดตาม (IN_PROGRESS)
        </Badge>
      );
  }
}

function getPlanStatusBadge(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          อนุมัติแล้ว
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          เสร็จสิ้น
        </span>
      );
    case "PENDING_APPROVAL":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          รออนุมัติ
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
          แบบร่าง
        </span>
      );
    default:
      return null;
  }
}

export interface Type7aPlotFollowUpTimelineProps {
  demoPlot: any;
  className?: string;
}

export function Type7aPlotFollowUpTimeline({
  demoPlot,
  className,
}: Type7aPlotFollowUpTimelineProps) {
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

  const timelineData: PlotFollowUpTimelineResult = extractPlotFollowUpTimeline(demoPlot);

  const openLightbox = (
    title: string,
    photos: PlotFollowUpPhoto[],
    index: number = 0,
  ) => {
    const formattedImages: LightboxImage[] = photos.map((p) => ({
      url: p.url,
      caption: p.name || title,
    }));
    setLightboxState({
      isOpen: true,
      title,
      images: formattedImages,
      initialIndex: index,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const isPlotClosed =
    timelineData.plotStatus === "COMPLETED" ||
    timelineData.closedDate != null ||
    timelineData.closureStats != null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* ─── 1. Header Overview & Stats ─── */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  ประวัติการลงพื้นที่ติดตามแปลงสาธิต (Follow-Up Journey)
                </h4>
                {getStatusBadge(timelineData.plotStatus)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามวงจรชีวิตแปลงสาธิต (Lifecycle) และเชื่อมโยงประวัติจากทุกแผนงาน Type 7B
              </p>
            </div>
          </div>

          {!isPlotClosed && (
            <Link
              href={`/activity-plans/new?type=TYPE_7B&sourcePlotId=${timelineData.plotId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างแผนติดตาม (7B)</span>
            </Link>
          )}
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-150">
            <span className="text-slate-400 block text-[11px] font-medium">
              จำนวนครั้งที่ติดตามแล้ว
            </span>
            <span className="text-base font-bold text-emerald-800">
              {timelineData.totalVisits} ครั้ง
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-150">
            <span className="text-slate-400 block text-[11px] font-medium">
              แผนงานที่เกี่ยวข้อง
            </span>
            <span className="text-base font-bold text-slate-800">
              {timelineData.totalPlans} แผนงาน
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-150">
            <span className="text-slate-400 block text-[11px] font-medium">
              ตรวจแปลงล่าสุดเมื่อ
            </span>
            <span className="text-xs font-bold text-slate-700">
              {formatThaiDate(timelineData.latestVisitDate)}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-150">
            <span className="text-slate-400 block text-[11px] font-medium">
              กำหนดฉีดพ่นรอบถัดไป
            </span>
            <span className="text-xs font-bold text-amber-700">
              {formatThaiDate(timelineData.nextSprayDate)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Timeline List ─── */}
      {timelineData.timeline.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm">
              ยังไม่มีประวัติการลงพื้นที่ติดตามสำหรับแปลงนี้
            </h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              เมื่อมีการสร้างแผนงานประเภท "ติดตามแปลงสาธิต (Type 7B)" และบันทึกผลการเข้าตรวจจริง
              ประวัติและภาพถ่ายในแต่ละรอบจะถูกรวบรวมแสดงในไทม์ไลน์นี้โดยอัตโนมัติ
            </p>
          </div>
          {!isPlotClosed && (
            <Link
              href={`/activity-plans/new?type=TYPE_7B&sourcePlotId=${timelineData.plotId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างแผนงานติดตามรอบแรก (Type 7B)</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {timelineData.timeline.map((item: PlotFollowUpItem, index: number) => {
            const isLast = index === timelineData.timeline.length - 1;

            return (
              <div key={item.id} className="relative group">
                {/* Step Marker */}
                <div
                  className={cn(
                    "absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs border-2 transition-all",
                    item.isPlannedOnly
                      ? "bg-slate-100 text-slate-600 border-slate-300"
                      : item.isClosure
                        ? "bg-amber-500 text-white border-amber-300"
                        : "bg-emerald-600 text-white border-emerald-200",
                  )}
                >
                  {item.visitNumber}
                </div>

                {/* Card Container */}
                <div
                  className={cn(
                    "bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3.5",
                    item.isClosure
                      ? "border-amber-300 bg-amber-50/15"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        ติดตามครั้งที่ {item.visitNumber}
                      </span>
                      {item.isClosure && (
                        <Badge className="bg-amber-500 text-white text-[10.5px] px-2 py-0">
                          รอบปิดแปลงสาธิต
                        </Badge>
                      )}
                      {item.isPlannedOnly && (
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 border-slate-300 text-[10.5px] px-2 py-0"
                        >
                          ตามแผน (ยังไม่บันทึกผลจริง)
                        </Badge>
                      )}
                    </div>

                    {/* Date & Days */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatThaiDate(item.visitDate)}
                      </span>
                      {item.daysSinceStart != null && item.daysSinceStart > 0 && (
                        <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {item.daysSinceStart} วันหลังเริ่มแปลง
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Link & Author Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-150 text-xs">
                    {/* Link to Trip Plan */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500">แผนงาน:</span>
                      {item.planId ? (
                        <Link
                          href={`/activity-plans/${item.planId}`}
                          className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 group/link"
                          target="_blank"
                          rel="noreferrer"
                          title="คลิกเพื่อเปิดดูรายละเอียด Trip Plan ในแท็บใหม่"
                        >
                          <span>
                            [{item.planCode || "Trip Plan"}] {item.planTitle}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-emerald-700 transition-colors" />
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {item.planTitle || "-"}
                        </span>
                      )}
                      {getPlanStatusBadge(item.planStatus)}
                    </div>

                    {/* Employee */}
                    {item.employeeName && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{item.employeeName}</span>
                      </div>
                    )}
                  </div>

                  {/* Condition Details (if actual visit recorded) */}
                  {!item.isPlannedOnly && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                      {/* Growth Stage */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                        <span className="text-slate-400 block text-[11px]">
                          ระยะพืช / อายุพืช:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {[
                            item.growthStage,
                            item.cropAgeValue != null
                              ? `${item.cropAgeValue} ${item.cropAgeUnit || "วัน"}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "-"}
                        </span>
                      </div>

                      {/* Crop Condition */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                        <span className="text-slate-400 block text-[11px]">
                          สภาพพืช & การเจริญเติบโต:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.cropCondition || "-"}
                          {item.cropProblemDesc && (
                            <span className="text-rose-600 font-normal block text-[11px]">
                              ปัญหา: {item.cropProblemDesc}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Product Response */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                        <span className="text-slate-400 block text-[11px]">
                          การตอบสนองต่อผลิตภัณฑ์:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.productResponse || "-"}
                          {item.productProblemDesc && (
                            <span className="text-rose-600 font-normal block text-[11px]">
                              อาการ: {item.productProblemDesc}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Spraying & Chemicals Info */}
                  {(item.sprayProducts.length > 0 ||
                    item.externalProducts.length > 0 ||
                    item.sprayMethod) && (
                    <div className="border border-slate-150 rounded-xl p-3 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                          <span>การใช้ผลิตภัณฑ์และการฉีดพ่นในรอบนี้</span>
                        </span>
                        {item.sprayMethod && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0",
                              item.sprayMethod === "TANK_MIXED"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-emerald-50 text-emerald-800 border-emerald-300",
                            )}
                          >
                            {item.sprayMethod === "TANK_MIXED"
                              ? "ผสมถัง (Tank-mixed)"
                              : "ฉีดเดี่ยว (Single)"}
                          </Badge>
                        )}
                      </div>

                      {/* Spray Equipment */}
                      {item.sprayEquipment && (
                        <div className="text-slate-600 text-[11.5px]">
                          อุปกรณ์ที่ใช้:{" "}
                          <span className="font-medium text-slate-800">
                            {item.sprayEquipment}
                            {item.otherEquipment ? ` (${item.otherEquipment})` : ""}
                          </span>
                        </div>
                      )}

                      {/* Products List */}
                      {item.sprayProducts.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-slate-400 text-[11px] font-medium">
                            รายการสินค้า:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.sprayProducts.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border",
                                  p.isAdditional
                                    ? "bg-amber-50 text-amber-900 border-amber-200"
                                    : "bg-slate-50 text-slate-800 border-slate-200",
                                )}
                              >
                                <span className="font-semibold">{p.name}</span>
                                {p.quantity != null && (
                                  <span className="text-slate-500">
                                    ({p.quantity} {p.unit || "หน่วย"})
                                  </span>
                                )}
                                {p.rate && (
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    @{p.rate}
                                  </span>
                                )}
                                {p.isAdditional && (
                                  <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1 rounded font-bold">
                                    ใช้เพิ่ม
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* External Products (Tank-mixed) */}
                      {item.externalProducts.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-100">
                          <span className="text-slate-400 text-[11px] font-medium">
                            ยาภายนอกที่ผสมร่วม (Tank-mixed):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.externalProducts.map((ep, epIdx) => (
                              <span
                                key={epIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                <span className="font-semibold">{ep.productName}</span>
                                {ep.company && (
                                  <span className="text-slate-400">({ep.company})</span>
                                )}
                                {ep.applicationRate && (
                                  <span className="text-slate-500">
                                    อัตรา: {ep.applicationRate}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">หมายเหตุ: </span>
                      <span>{item.notes}</span>
                    </div>
                  )}

                  {/* Photos Grid */}
                  {item.photos.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ภาพถ่ายรอบติดตามนี้ ({item.photos.length} รูป)</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          คลิกเพื่อดูรูปขนาดเต็ม
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {item.photos.map((photo, pIdx) => (
                          <button
                            type="button"
                            key={photo.id || pIdx}
                            onClick={() =>
                              openLightbox(
                                `ภาพถ่ายติดตามครั้งที่ ${item.visitNumber}`,
                                item.photos,
                                pIdx,
                              )
                            }
                            className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 hover:shadow-xs transition-all cursor-pointer"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name || `ภาพติดตามครั้งที่ ${item.visitNumber}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] text-white font-semibold bg-black/60 px-1.5 py-0.5 rounded">
                                ขยาย
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. Final Evaluation Closure Card (When plot is COMPLETED) ─── */}
      {timelineData.closureStats && (
        <div className="bg-gradient-to-br from-amber-50 to-emerald-50/50 border-2 border-amber-300 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <span>สรุปผลการปิดแปลงสาธิต (Final Harvest Evaluation)</span>
                  <Badge className="bg-emerald-600 text-white text-[10.5px]">
                    สำเร็จบริบูรณ์
                  </Badge>
                </h4>
                <p className="text-xs text-slate-500">
                  ประเมินผลผลิต ความพึงพอใจเกษตรกร และโอกาสทางการค้าเมื่อสิ้นสุดโครงการสาธิต
                </p>
              </div>
            </div>

            {timelineData.closureStats.finalHarvestDate && (
              <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                วันเก็บเกี่ยว: {formatThaiDate(timelineData.closureStats.finalHarvestDate)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            {/* Yield Comparison */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
              <span className="text-slate-500 font-medium block">
                การเปรียบเทียบผลผลิต:
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-600">แปลงสาธิต:</span>
                <span className="text-sm font-bold text-emerald-800">
                  {timelineData.closureStats.demoYieldKg != null
                    ? `${timelineData.closureStats.demoYieldKg.toLocaleString()} กก.`
                    : "-"}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-slate-500 text-[11px]">
                <span>แปลงควบคุม:</span>
                <span>
                  {timelineData.closureStats.controlYieldKg != null
                    ? `${timelineData.closureStats.controlYieldKg.toLocaleString()} กก.`
                    : "-"}
                </span>
              </div>
              {timelineData.closureStats.yieldIncreasePercent != null && (
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> ผลผลิตเพิ่มขึ้น
                  </span>
                  <span>+{timelineData.closureStats.yieldIncreasePercent}%</span>
                </div>
              )}
            </div>

            {/* Satisfaction */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
              <span className="text-slate-500 font-medium block">
                ความพึงพอใจของเกษตรกร:
              </span>
              <div className="flex items-center gap-1 text-amber-500 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-4 h-4",
                      star <= (timelineData.closureStats?.farmerSatisfaction || 0)
                        ? "fill-amber-400 text-amber-500"
                        : "text-slate-200",
                    )}
                  />
                ))}
                <span className="text-xs font-bold text-slate-800 ml-1.5">
                  {timelineData.closureStats.farmerSatisfaction != null
                    ? `${timelineData.closureStats.farmerSatisfaction} / 5 คะแนน`
                    : "-"}
                </span>
              </div>
            </div>

            {/* Commercial Potential */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
              <span className="text-slate-500 font-medium block">
                โอกาสสั่งซื้อเชิงพาณิชย์:
              </span>
              <span className="text-sm font-bold text-slate-800 block pt-1">
                {timelineData.closureStats.commercialPotential || "-"}
              </span>
            </div>
          </div>

          {timelineData.closureStats.finalSummaryNotes && (
            <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">
                สรุปผลสัมฤทธิ์เมื่อปิดแปลง:
              </span>
              <p className="leading-relaxed">
                {timelineData.closureStats.finalSummaryNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
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

