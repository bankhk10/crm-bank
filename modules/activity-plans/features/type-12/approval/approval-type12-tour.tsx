"use client";

import React from "react";
import { Plane, Building2, Globe2, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ApprovalType12TourProps {
  isVisible: boolean;
  tourType?: "ทัวร์กลาง" | "ทัวร์ร้านค้า" | "CENTRAL" | "STORE" | string | null;
  tourSize?: "ทัวร์เล็ก" | "ทัวร์ใหญ่" | "SMALL" | "LARGE" | string | null;
  country?: string | null;
  storeName?: string | null;
  destination?: string | null;
}

export function ApprovalType12Tour({
  isVisible,
  tourType = "CENTRAL",
  tourSize,
  country,
  storeName,
  destination,
}: ApprovalType12TourProps) {
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
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {tourTypeLabel}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 bg-sky-50 text-sky-700 border-sky-200"
              >
                CENTRAL
              </Badge>
            </div>
          </div>

          {/* ขนาดทัวร์ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              ขนาดทัวร์
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {tourSizeLabel}
              </span>
              {tourSize && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0",
                    tourSize === "LARGE" || tourSize === "ทัวร์ใหญ่"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200",
                  )}
                >
                  {tourSize === "LARGE" || tourSize === "ทัวร์ใหญ่"
                    ? "BIG / LARGE"
                    : "MINI / SMALL"}
                </Badge>
              )}
            </div>
          </div>

          {/* ประเทศที่เดินทางไป */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              ประเทศที่เดินทางไป
            </span>
            <div className="pt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {countryValue}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: ทัวร์ร้านค้า (STORE) -> แสดง: ประเภททัวร์, ร้านค้า, สถานที่ที่จะไป */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {/* ประเภททัวร์ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              ประเภททัวร์
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {tourTypeLabel}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 bg-amber-50 text-amber-700 border-amber-200"
              >
                STORE
              </Badge>
            </div>
          </div>

          {/* ร้านค้า */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              ร้านค้า
            </span>
            <div className="pt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {storeValue}
              </span>
            </div>
          </div>

          {/* สถานที่ที่จะไป */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              สถานที่ที่จะไป
            </span>
            <div className="pt-0.5">
              <span className="text-sm font-bold text-slate-900">
                {destinationValue}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
