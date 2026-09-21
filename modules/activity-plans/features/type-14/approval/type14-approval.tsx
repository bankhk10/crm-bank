"use client";

import React, { useState } from "react";
import {
  Clock,
  Layers,
  MapPin,
  Store,
  User,
  Calendar,
  Eye,
  X,
  FileText,
  Camera,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type14PlanInput } from "../../../application/validations";

export interface Type14ApprovalProps {
  data: Type14PlanInput;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}

export function Type14Approval({ data, planSummary }: Type14ApprovalProps) {
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
    <div className="space-y-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between p-3.5 bg-purple-50/80 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
            ติดตามแปลงแฮทแทค (TYPE_14)
          </h5>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
          {data.mode === "EXISTING_PLOT" ? "แปลงเดิม" : "แปลงใหม่"} • {data.trackings?.length || 0} การติดตาม
        </span>
      </div>

      {/* Plot Info Card */}
      <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">
            {data.name || "แปลงแฮตแทค"}
          </span>
          {hasCoords && (
            <a
              href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-purple-600 font-semibold hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>เปิดแผนที่ Google Maps</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px] block">ร้านค้า Dealer:</span>
            <span className="font-semibold text-slate-700 truncate block">
              {data.storeId || "-"}
            </span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px] block">เกษตรกร:</span>
            <span className="font-semibold text-slate-700 truncate block">
              {data.ownerName || "-"}
            </span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-slate-400 text-[11px] block">พิกัด GPS:</span>
            <span className="font-semibold text-purple-700 truncate block">
              {hasCoords ? `${data.latitude}, ${data.longitude}` : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Trackings Summary */}
      <div className="space-y-3">
        <h6 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>รายการติดตามผล ({data.trackings?.length || 0} ครั้ง):</span>
        </h6>

        {(data.trackings || []).map((t, idx) => (
          <div
            key={idx}
            className="p-3 bg-purple-50/30 border border-purple-100 rounded-xl space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                ครั้งที่ {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">
                  {typeof t.visitDate === "string"
                    ? t.visitDate.split("T")[0]
                    : t.visitDate instanceof Date
                      ? t.visitDate.toISOString().split("T")[0]
                      : "-"}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 border-purple-200 font-semibold"
                >
                  หลังฉีด {t.daysSinceStart ?? 0} วัน
                </Badge>
              </div>
            </div>

            {t.notes && (
              <p className="text-slate-600 bg-white p-2 rounded-lg border border-purple-50 leading-relaxed whitespace-pre-line">
                {t.notes}
              </p>
            )}

            {t.attachments && t.attachments.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1">
                  รูปภาพผลหลังการฉีดพ่น ({t.attachments.length} รูป):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {t.attachments.map((att: any, aIdx: number) => (
                    <div
                      key={aIdx}
                      className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs"
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
                          className="p-1 rounded-full bg-white/90 text-slate-700 hover:bg-white"
                        >
                          <Eye className="w-3 h-3" />
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
