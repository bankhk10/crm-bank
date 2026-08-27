"use client";

import React from "react";
import { Plane, Building2, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DetailType12TourProps {
  isVisible: boolean;
  tourType?: "ทัวร์กลาง" | "ทัวร์ร้านค้า" | string;
  tourSize?: string;
  country?: string;
  storeName?: string;
  destination?: string;
}

export function DetailType12Tour({
  isVisible,
  tourType = "ทัวร์กลาง",
  tourSize,
  country,
  storeName,
  destination,
}: DetailType12TourProps) {
  if (!isVisible) return null;

  const isStoreTour = tourType === "ทัวร์ร้านค้า";

  return (
    <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
            <Plane className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900 text-base md:text-lg">
            ทัวร์
          </h2>
        </div>
        <Badge
          variant="outline"
          className="bg-sky-50 text-sky-800 border-sky-200 text-xs px-2.5 py-0.5"
        >
          {tourType}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* ประเภททัวร์ */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            {isStoreTour ? (
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            ประเภททัวร์
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
            {tourType}
          </span>
        </div>

        {/* Conditional Field 1 */}
        {!isStoreTour ? (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ขนาดทัวร์
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {tourSize || "-"}
            </span>
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ร้านค้า
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {storeName || "-"}
            </span>
          </div>
        )}

        {/* Conditional Field 2 */}
        {!isStoreTour ? (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2">
            <span className="text-xs text-slate-500 font-medium block">
              ประเทศ
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block">
              {country || "-"}
            </span>
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2">
            <span className="text-xs text-slate-500 font-medium block">
              สถานที่จะไป
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block">
              {destination || "-"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
