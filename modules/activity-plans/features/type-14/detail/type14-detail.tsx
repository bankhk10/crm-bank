"use client";

import React, { useState } from "react";
import {
  Clock,
  Layers,
  MapPin,
  ExternalLink,
  Store,
  User,
  Calendar,
  Eye,
  X,
  FileText,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Type14PlanInput } from "../../../application/validations";

export interface Type14DetailProps {
  data: Type14PlanInput;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}

export function Type14Detail({ data, planSummary }: Type14DetailProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
        ไม่มีข้อมูลการติดตามแปลงแฮตแทค
      </div>
    );
  }

  const hasCoords = Boolean(data.latitude?.trim() && data.longitude?.trim());

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            14
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              ติดตามแปลงแฮทแทค (TYPE_14)
            </h4>
            <p className="text-xs text-slate-500">
              รายละเอียดแปลงแฮตแทคและประวัติการตรวจติดตาม
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs px-2.5 py-1 font-semibold rounded-lg bg-purple-50 text-purple-700 border-purple-200 self-start sm:self-auto"
        >
          {data.mode === "EXISTING_PLOT" ? "แปลงเดิม (Existing Plot)" : "แปลงใหม่ (New Plot)"}
        </Badge>
      </div>

      {/* Plot Overview Card */}
      <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h5 className="font-bold text-sm text-slate-800">
              {data.name || "แปลงแฮตแทค"}
            </h5>
          </div>

          {hasCoords && (
            <a
              href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดดูแผนที่ Google Maps</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Dealer */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Store className="w-3 h-3 text-slate-400" />
              ร้านค้าตัวแทนจำหน่าย (Dealer):
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {data.storeId || "-"}
            </span>
          </div>

          {/* Farmer Owner */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              เกษตรกรเจ้าของแปลง:
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {data.ownerName || "-"}
            </span>
          </div>

          {/* Location */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              พื้นที่ (อำเภอ, จังหวัด):
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {data.district || planSummary?.district || "-"},{" "}
              {data.province || planSummary?.province || "-"}
            </span>
          </div>

          {/* GPS Coordinates */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              พิกัด GPS:
            </span>
            <span className="font-bold text-purple-700 truncate block">
              {hasCoords ? `${data.latitude}, ${data.longitude}` : "ยังไม่ได้ระบุพิกัด"}
            </span>
          </div>
        </div>
      </div>

      {/* Trackings History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h5 className="font-bold text-xs sm:text-sm text-slate-800">
              ประวัติการติดตามผล ({data.trackings?.length || 0} ครั้ง)
            </h5>
          </div>
        </div>

        {(!data.trackings || data.trackings.length === 0) ? (
          <p className="text-xs text-slate-400 italic py-2">
            ยังไม่มีบันทึกข้อมูลการติดตามผล
          </p>
        ) : (
          <div className="space-y-4">
            {data.trackings.map((tracking, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 bg-purple-50/20 border border-purple-100 rounded-2xl space-y-3 shadow-2xs"
              >
                {/* Tracking Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-800">
                      การตรวจติดตามครั้งที่ {idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[11px] px-2 py-0.5 bg-white text-purple-700 border-purple-200 flex items-center gap-1 font-semibold"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>
                        {typeof tracking.visitDate === "string"
                          ? tracking.visitDate.split("T")[0]
                          : tracking.visitDate instanceof Date
                            ? tracking.visitDate.toISOString().split("T")[0]
                            : "-"}
                      </span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[11px] px-2 py-0.5 bg-purple-100 text-purple-800 border-purple-200 font-bold"
                    >
                      หลังฉีด {tracking.daysSinceStart ?? 0} วัน
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                {tracking.notes && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      บันทึก / อาการของพืช / ผลการฉีดพ่น:
                    </span>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-purple-50 leading-relaxed whitespace-pre-line">
                      {tracking.notes}
                    </p>
                  </div>
                )}

                {/* Photos */}
                {tracking.attachments && tracking.attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-purple-600" />
                      รูปภาพผลหลังการฉีดพ่น ({tracking.attachments.length} รูป):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {tracking.attachments.map((att: any, aIdx: number) => (
                        <div
                          key={aIdx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs"
                        >
                          <img
                            src={att.fileUrl}
                            alt={att.fileName || `รูปภาพ #${aIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(att.fileUrl)}
                              className="p-1.5 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow-xs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="ดูรูปถ่ายเต็มขนาด"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
