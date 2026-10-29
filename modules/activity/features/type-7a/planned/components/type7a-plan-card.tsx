"use client";

import React from "react";
import { Sprout, MapPin, User, Package, Target } from "lucide-react";
import type { Type7aPlanCardProps } from "../types/planned.types";
import { formatPhoneNumber } from "../../shared/utils";
import { cn } from "@/lib/utils";

export function Type7aPlanCard({ targets = [], className }: Type7aPlanCardProps) {
  if (!targets || targets.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
        <Sprout className="h-4 w-4 text-emerald-600" />
        <span>ข้อมูลแปลงสาธิตตามแผน ({targets.length} แปลง)</span>
      </div>

      <div className="space-y-3">
        {targets.map((target, idx) => (
          <div
            key={target.id || idx}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span>{target.plotName || target.name || "แปลงสาธิต"}</span>
              </h4>

              {target.areaRai != null && (
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-100">
                  พื้นที่ {String(target.areaRai)} ไร่
                </span>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>เกษตรกร:</span>
                <span className="font-semibold text-slate-800">
                  {target.ownerName || target.farmerName || "-"}
                  {(target.farmerPhone || target.ownerPhone) && (
                    <span className="text-slate-500 font-normal ml-1">
                      ({formatPhoneNumber(target.farmerPhone || target.ownerPhone)})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Sprout className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>พืชที่ทดสอบ:</span>
                <span className="font-semibold text-slate-800">
                  {target.cropName || target.cropCategory || "-"}
                </span>
              </div>

              {(target.province || target.district) && (
                <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>พื้นที่:</span>
                  <span className="font-medium text-slate-800">
                    {[target.district, target.province].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {target.objective && (
                <div className="flex items-start gap-2 text-slate-600 sm:col-span-2">
                  <Target className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>วัตถุประสงค์:</span>
                  <span className="font-medium text-slate-800">{target.objective}</span>
                </div>
              )}
            </div>

            {/* Products List */}
            {target.demoProducts && target.demoProducts.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1.5">
                  <Package className="w-3 h-3 text-slate-400" />
                  สินค้าสาธิต:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {target.demoProducts.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700"
                    >
                      {p.productName || "-"} ({String(p.quantity || 1)} {p.unit || "ชิ้น"})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
