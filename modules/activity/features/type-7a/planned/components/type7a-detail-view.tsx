"use client";

import React from "react";
import { Sprout, MapPin, User, Package, Calendar, Camera } from "lucide-react";
import type { Type7aDetailViewProps } from "../types/actual.types";

export function Type7aDetailView({
  isVisible = true,
  target,
  targets = [],
  actualResult,
  attachments = [],
}: Type7aDetailViewProps) {
  if (!isVisible) return null;

  const plotList = targets.length > 0 ? targets : target ? [target] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
        <Sprout className="h-5 w-5 text-emerald-600" />
        <span>ข้อมูลการจัดทำแปลงสาธิต (Type 7A)</span>
      </div>

      {plotList.map((p, idx) => (
        <div
          key={p.id || idx}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </span>
              <span>{p.plotName || p.name || "แปลงสาธิต"}</span>
            </h4>

            {p.areaRai != null && (
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                พื้นที่ {String(p.areaRai)} ไร่
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">เกษตรกร:</span>
              <span className="font-semibold text-slate-800">
                {p.ownerName || p.farmerName || "-"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">พืชที่ทดสอบ:</span>
              <span className="font-semibold text-slate-800">
                {p.cropName || p.cropCategory || "-"}
              </span>
            </div>

            {(p.province || p.district) && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">สถานที่:</span>
                <span className="font-medium text-slate-800">
                  {[p.district, p.province].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {p.objective && (
              <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700">วัตถุประสงค์: </span>
                <span className="text-slate-600">{p.objective}</span>
              </div>
            )}
          </div>

          {/* Photos */}
          {attachments && attachments.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                รูปถ่ายแปลงสาธิต ({attachments.length} รูป)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {attachments.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={img.fileUrl || img.url}
                      alt={img.fileName || "รูปถ่ายแปลงสาธิต"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Backward-compatible alias
export const DetailType7NewDemo = Type7aDetailView;
