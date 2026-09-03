"use client";

import React from "react";
import { Plane, Building2, Globe2, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DetailType12TourProps {
  isVisible: boolean;
  tourType?: "ทัวร์กลาง" | "ทัวร์ร้านค้า" | "CENTRAL" | "STORE" | string | null;
  tourSize?: "ทัวร์เล็ก" | "ทัวร์ใหญ่" | "SMALL" | "LARGE" | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
}

export function DetailType12Tour({
  isVisible,
  tourType = "CENTRAL",
  tourSize,
  country,
  storeName,
  destination,
}: DetailType12TourProps) {
  if (!isVisible) return null;

  // 1. Resolve normalized tour type
  const isStoreTour =
    tourType === "STORE" ||
    tourType === "ทัวร์ร้านค้า" ||
    (Boolean(storeName) && !country);

  const tourTypeLabel = isStoreTour ? "ทัวร์ร้านค้า" : "ทัวร์กลาง";

  // 2. Resolve normalized tour size (for Central tour)
  let tourSizeLabel = "ไม่ได้ระบุ";
  if (tourSize === "LARGE" || tourSize === "ทัวร์ใหญ่") {
    tourSizeLabel = "ทัวร์ใหญ่";
  } else if (tourSize === "SMALL" || tourSize === "ทัวร์เล็ก") {
    tourSizeLabel = "ทัวร์เล็ก";
  } else if (
    tourSize &&
    typeof tourSize === "string" &&
    tourSize.trim() !== ""
  ) {
    tourSizeLabel = tourSize.trim();
  }

  // 3. Resolve country, store, and destination safely
  const countryValue = country?.trim() || "ไม่ได้ระบุ";
  const storeValue = storeName?.trim() || "ไม่ได้ระบุ";
  const destinationValue = destination?.trim() || "ไม่ได้ระบุ";

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 shadow-xs">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 shadow-2xs">
            <Plane className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                รายละเอียดทัวร์
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              รายละเอียดแผนงานทัวร์ที่กำหนดไว้ใน Trip Plan
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "self-start sm:self-auto text-xs px-3 py-1 font-semibold rounded-full flex items-center gap-1.5",
            isStoreTour
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-sky-50 text-sky-800 border-sky-200",
          )}
        >
          {isStoreTour ? (
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <Globe2 className="w-3.5 h-3.5 text-sky-600" />
          )}
          <span>{tourTypeLabel}</span>
        </Badge>
      </div>

      {/* ─── Main Information Card Grid ─── */}
      {!isStoreTour ? (
        /* CASE 1: ทัวร์กลาง (CENTRAL) -> แสดง: ประเภททัวร์, ขนาดทัวร์, ประเทศ */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {/* ประเภททัวร์ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              ประเภททัวร์
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              ทัวร์กลาง
            </span>
          </div>

          {/* ขนาดทัวร์ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              ขนาดทัวร์
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {tourSizeLabel}
            </span>
          </div>

          {/* ประเทศ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              ประเทศ
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {countryValue}
            </span>
          </div>
        </div>
      ) : (
        /* CASE 2: ทัวร์ร้านค้า (STORE) -> แสดง: ประเภททัวร์, ร้านค้า, สถานที่จะไป */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* ประเภททัวร์ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              ประเภททัวร์
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              ทัวร์ร้านค้า
            </span>
          </div>

          {/* ร้านค้า */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              ร้านค้า
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {storeValue}
            </span>
          </div>

          {/* สถานที่จะไป */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              สถานที่จะไป
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {destinationValue}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
