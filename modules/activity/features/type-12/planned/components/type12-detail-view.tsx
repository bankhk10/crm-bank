"use client";

import React, { useState } from "react";
import {
  Plane,
  Building2,
  Globe2,
  MapPin,
  Users,
  Camera,
  FileText,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Type12PlanCard } from "./type12-plan-card";
import type { Type12DetailViewProps } from "../types/actual.types";
import type { Type12ImageFile } from "../../shared/types";

export type { Type12DetailViewProps };

export function Type12DetailView(props: Type12DetailViewProps) {
  const {
    isVisible = true,
    target,
    targets,
    tourType,
    tourSize,
    country,
    storeName,
    destination,
    actualAttendees,
    tourHighlights,
    feedbackIssues,
    images = [],
    effectiveT12Images = [],
    className = "",
  } = props;

  const [activePhoto, setActivePhoto] = useState<Type12ImageFile | null>(null);

  if (!isVisible) return null;

  const allImages = (effectiveT12Images.length > 0 ? effectiveT12Images : images) || [];
  const hasActual = Boolean(
    actualAttendees ||
      tourHighlights ||
      feedbackIssues ||
      allImages.length > 0,
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Planned Tour Card */}
      <Type12PlanCard
        isVisible={isVisible}
        target={target}
        targets={targets}
        tourType={tourType}
        tourSize={tourSize}
        country={country}
        storeName={storeName}
        destination={destination}
      />

      {/* 2. Actual Tour Execution Details (if recorded) */}
      {hasActual && (
        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  ผลการปฏิบัติงาน: พาลูกค้าศึกษาดูงาน (Tour)
                </h4>
                <p className="text-xs text-slate-500">
                  ข้อมูลสรุปผลการเดินทางและรูปภาพกิจกรรม
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5 font-bold"
            >
              ACTUAL RECORDED
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* จำนวนผู้ร่วมเดินทางจริง */}
            {actualAttendees !== undefined && actualAttendees !== "" && (
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  ผู้ร่วมเดินทางจริง
                </span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                  {actualAttendees} คน
                </span>
              </div>
            )}
          </div>

          {/* ไฮไลท์การดูงาน */}
          {tourHighlights && (
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                ไฮไลท์ / ประโยชน์ที่ได้รับ
              </span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {tourHighlights}
              </p>
            </div>
          )}

          {/* ข้อคิดเห็น/ปัญหาอุปสรรค */}
          {feedbackIssues && (
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                ข้อคิดเห็นลูกค้า / ปัญหาและอุปสรรค
              </span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {feedbackIssues}
              </p>
            </div>
          )}

          {/* รูปภาพกิจกรรม */}
          {allImages.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-sky-600" />
                รูปภาพกิจกรรมศึกษาดูงาน ({allImages.length} รูป)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {allImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    onClick={() => setActivePhoto(img)}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.name || `Tour Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-transparent rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activePhoto.url}
              alt={activePhoto.name || "Preview"}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            {activePhoto.name && (
              <p className="text-center text-xs text-white/90 mt-2 bg-black/40 py-1 px-3 rounded-full mx-auto w-fit">
                {activePhoto.name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { Type12DetailView as DetailType12Tour };
