"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Info,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DemoPlotHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: {
    id?: string;
    code?: string;
    name?: string;
    ownerName?: string;
    cropCategory?: string;
    cropName?: string;
    targetCrop?: string;
    primaryProductName?: string;
    productName?: string;
    showcase?: string;
    areaRai?: number | string | null;
    treeCount?: number | string | null;
    location?: string | null;
    startDate?: string | Date;
    plantingDate?: string | Date | null;
    plantingAreaCondition?: string | null;
    usageMethod?: string | null;
    objective?: string | null;
    experimentDetail?: string | null;
    status?: string;
    visitsCount?: number;
    daysSinceStart?: number;
    totalCost?: number;
    visits?: Array<{
      id: string;
      visitNumber: number;
      visitDate: string | Date;
      daysSinceStart: number;
      cropAgeValue?: number | null;
      cropAgeUnit?: string | null;
      growthStage?: string | null;
      cropCondition?: string | null;
      cropProblemDesc?: string | null;
      productResponse?: string | null;
      productProblemDesc?: string | null;
      usageMethod?: string | null;
      cropImageUrls?: string[];
      plotImageUrls?: string[];
      imageUrls?: string[];
      notes?: string | null;
      activityPlan?: {
        id: string;
        code?: string;
        title?: string;
        startDate?: string | Date;
      } | null;
    }>;
  } | null;
}

export function DemoPlotHistoryModal({
  isOpen,
  onClose,
  plot,
}: DemoPlotHistoryModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [expandedVisits, setExpandedVisits] = useState<Record<string, boolean>>(
    {},
  );

  if (!plot) return null;

  const visits = plot.visits || [];
  const totalVisits = visits.length;

  const toggleVisit = (id: string) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "-";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 rounded-2xl border-slate-200">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {plot.code && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-100 font-mono text-xs font-bold border border-emerald-500/30">
                    {plot.code}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-400/20">
                  {plot.status === "COMPLETED"
                    ? "ปิดแปลงสมบูรณ์"
                    : plot.status === "FAILED"
                      ? "ยุติการทดลอง"
                      : "กำลังทดลอง"}
                </span>
                <span className="text-xs text-emerald-200 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  บันทึกแล้ว {totalVisits} ครั้ง
                </span>
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {plot.name || `แปลงสาธิต ${plot.ownerName || ""}`}
              </DialogTitle>
              <DialogDescription className="sr-only">
                ประวัติการติดตามแปลงสาธิตและผลการตรวจแปลง
              </DialogDescription>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Master Plot Reference Strip */}
          <div className="bg-white border-b border-slate-200 px-5 py-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">
                  เจ้าของแปลง
                </span>
                <span className="font-bold text-slate-800">
                  {plot.ownerName || "-"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">พืช</span>
                <span className="font-bold text-slate-800">
                  {plot.targetCrop || plot.cropName || "-"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">
                  สินค้าสาธิตหลัก
                </span>
                <span className="font-bold text-emerald-700">
                  {plot.showcase ||
                    plot.primaryProductName ||
                    plot.productName ||
                    "-"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">
                  วันเริ่มแปลง / วันปลูก
                </span>
                <span className="font-bold text-slate-800">
                  {formatDate(plot.plantingDate || plot.startDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Timeline Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Master Initial Setup Card */}
            <div className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  ข้อมูลตั้งต้นตอนเริ่มทำแปลง (Initial Setup)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {formatDate(plot.plantingDate || plot.startDate)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">
                    สภาพพื้นที่ปลูกตอนเริ่ม:{" "}
                  </span>
                  <span className="font-medium text-slate-800">
                    {plot.plantingAreaCondition || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    วิธีใช้ / อัตราการใช้เริ่มต้น:{" "}
                  </span>
                  <span className="font-medium text-slate-800">
                    {plot.usageMethod || "-"}
                  </span>
                </div>
                {plot.objective && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-500">
                      วัตถุประสงค์:{" "}
                    </span>
                    <span className="text-slate-800">{plot.objective}</span>
                  </div>
                )}
                {plot.experimentDetail && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-500">
                      รายละเอียดการทดลอง:{" "}
                    </span>
                    <span className="text-slate-800">
                      {plot.experimentDetail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Visits Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  ลำดับประวัติการติดตาม (Timeline)
                </h3>
                <span className="text-xs text-slate-500">
                  ทั้งหมด {totalVisits} ครั้ง
                </span>
              </div>

              {visits.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">
                    ยังไม่มีบันทึกประวัติการติดตาม
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {visits.map((v, idx) => {
                    const isExpanded = expandedVisits[v.id] !== false; // Default expanded
                    const cropPhotos = v.cropImageUrls || [];
                    const plotPhotos =
                      v.plotImageUrls ||
                      (v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls : []);
                    const totalPhotos = cropPhotos.length + plotPhotos.length;

                    return (
                      <div
                        key={v.id || idx}
                        className="relative pl-8 transition-all"
                      >
                        {/* Timeline Node Icon */}
                        <div className="absolute left-1.5 top-3 -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs z-10 ring-4 ring-slate-50">
                          {v.visitNumber || idx + 1}
                        </div>

                        {/* Visit Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-emerald-300">
                          {/* Card Header */}
                          <div
                            onClick={() => toggleVisit(v.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-bold text-xs text-emerald-950">
                                การติดตามครั้งที่ {v.visitNumber || idx + 1}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                📅 {formatDate(v.visitDate)}
                              </span>
                              {v.daysSinceStart > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                                  +{v.daysSinceStart} วัน
                                </span>
                              )}
                              {v.activityPlan?.code && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                                  {v.activityPlan.code}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {totalPhotos > 0 && (
                                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  {totalPhotos} รูป
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Card Body */}
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-100 space-y-3.5 text-xs text-slate-700">
                              {/* Observation Status Badges */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    อายุพืช
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {v.cropAgeValue
                                      ? `${v.cropAgeValue} ${v.cropAgeUnit || "วัน"}`
                                      : "-"}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    ระยะเจริญเติบโต
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {v.growthStage || "-"}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    สภาพพืช
                                  </span>
                                  <span
                                    className={cn(
                                      "font-bold flex items-center gap-1",
                                      v.cropCondition === "สมบูรณ์"
                                        ? "text-emerald-700"
                                        : "text-amber-700",
                                    )}
                                  >
                                    {v.cropCondition === "สมบูรณ์" ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    {v.cropCondition || "-"}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    ผลการใช้ผลิตภัณฑ์
                                  </span>
                                  <span
                                    className={cn(
                                      "font-bold flex items-center gap-1",
                                      v.productResponse === "พืชตอบสนองดี"
                                        ? "text-emerald-700"
                                        : "text-amber-700",
                                    )}
                                  >
                                    {v.productResponse || "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Problem Details */}
                              {(v.cropProblemDesc || v.productProblemDesc) && (
                                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
                                  {v.cropProblemDesc && (
                                    <div>
                                      <span className="font-semibold">
                                        ปัญหาของสภาพพืช:{" "}
                                      </span>
                                      <span>{v.cropProblemDesc}</span>
                                    </div>
                                  )}
                                  {v.productProblemDesc && (
                                    <div>
                                      <span className="font-semibold">
                                        ปัญหาการใช้ผลิตภัณฑ์:{" "}
                                      </span>
                                      <span>{v.productProblemDesc}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Usage Method & Notes */}
                              {v.usageMethod && (
                                <div>
                                  <span className="font-semibold text-slate-500">
                                    วิธีการใช้รอบนี้:{" "}
                                  </span>
                                  <span className="text-slate-800">
                                    {v.usageMethod}
                                  </span>
                                </div>
                              )}
                              {v.notes && (
                                <div>
                                  <span className="font-semibold text-slate-500">
                                    หมายเหตุ:{" "}
                                  </span>
                                  <span className="text-slate-800">
                                    {v.notes}
                                  </span>
                                </div>
                              )}

                              {/* Photo Galleries */}
                              {/* 1. Crop Images */}
                              {cropPhotos.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    🌿 รูปสภาพพืช ({cropPhotos.length} รูป)
                                  </span>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {cropPhotos.map((url, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setSelectedPhoto(url)}
                                        className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                                      >
                                        <img
                                          src={url}
                                          alt={`Crop Photo ${pIdx + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Maximize2 className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 2. Plot Images */}
                              {plotPhotos.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    📷 รูปภาพสภาพแปลง ({plotPhotos.length} รูป)
                                  </span>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {plotPhotos.map((url, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setSelectedPhoto(url)}
                                        className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                                      >
                                        <img
                                          src={url}
                                          alt={`Plot Photo ${pIdx + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Maximize2 className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Expanded Preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain mx-auto"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
