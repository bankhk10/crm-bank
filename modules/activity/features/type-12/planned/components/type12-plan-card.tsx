"use client";

import React from "react";
import { Plane, Building2, Globe2, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type12PlanCardProps } from "../types/planned.types";

export type { Type12PlanCardProps };

export function Type12PlanCard({
  isVisible = true,
  planType,
  target,
  targets,
  tourType = "CENTRAL",
  tourSize,
  country,
  storeName,
  destination,
  className = "",
}: Type12PlanCardProps) {
  if (!isVisible || planType === "UNPLANNED") return null;

  if (targets && targets.length > 1) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type12PlanCard
            key={t.id || idx}
            isVisible={isVisible}
            planType={planType}
            target={t}
            className={className}
          />
        ))}
      </div>
    );
  }

  const resolvedTarget = targets && targets.length === 1 ? targets[0] : target;
  if (!resolvedTarget && !country && !storeName && !destination) {
    return null;
  }

  const effectiveTourType = resolvedTarget?.tourType ?? tourType;
  const effectiveTourSize = resolvedTarget?.tourSize ?? tourSize;
  const effectiveCountry = resolvedTarget?.country ?? country;
  const effectiveStoreName = resolvedTarget?.storeName ?? storeName;
  const effectiveDestination = resolvedTarget?.destination ?? destination;

  // 1. Resolve normalized tour type
  const isStoreTour =
    effectiveTourType === "STORE" ||
    effectiveTourType === "ทัวร์ร้านค้า" ||
    (Boolean(effectiveStoreName) && !effectiveCountry);

  const tourTypeLabel = isStoreTour ? "ทัวร์ร้านค้า" : "ทัวร์กลาง";

  // 2. Resolve normalized tour size (for Central tour)
  let tourSizeLabel = "ไม่ได้ระบุ";
  if (effectiveTourSize === "LARGE" || effectiveTourSize === "ทัวร์ใหญ่") {
    tourSizeLabel = "ทัวร์ใหญ่";
  } else if (effectiveTourSize === "SMALL" || effectiveTourSize === "ทัวร์เล็ก") {
    tourSizeLabel = "ทัวร์เล็ก";
  } else if (
    effectiveTourSize &&
    typeof effectiveTourSize === "string" &&
    effectiveTourSize.trim() !== ""
  ) {
    tourSizeLabel = effectiveTourSize.trim();
  }

  // 3. Resolve country, store, and destination safely
  const countryValue = effectiveCountry?.trim() || "ไม่ได้ระบุ";
  const storeValue = effectiveStoreName?.trim() || "ไม่ได้ระบุ";
  const destinationValue = effectiveDestination?.trim() || "ไม่ได้ระบุ";

  return (
    <div
      className={`bg-white border border-sky-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              ข้อมูลตามแผนงาน: พาลูกค้าศึกษาดูงาน (Tour)
            </h4>
            <p className="text-xs text-slate-500">
              รายละเอียดประเภททัวร์และสถานที่ตามแผน
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-sky-50 text-sky-700 border-sky-200 text-xs px-2.5 py-0.5 font-bold"
          >
            {tourTypeLabel}
          </Badge>
          <Badge
            variant="outline"
            className="bg-slate-50 text-slate-600 border-slate-200 text-[11px] font-semibold px-2 py-0.5"
          >
            PLAN
          </Badge>
        </div>
      </div>

      {/* Grid Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* ประเภททัวร์ */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
          <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            ประเภททัวร์
          </span>
          <span className="font-bold text-slate-800 text-xs sm:text-sm block">
            {tourTypeLabel}
          </span>
        </div>

        {/* ขนาดทัวร์ (Central Tour only) */}
        {!isStoreTour && (
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              ขนาดทัวร์
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
              {tourSizeLabel}
            </span>
          </div>
        )}

        {/* ประเทศ (Central Tour only) */}
        {!isStoreTour && (
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              ประเทศ
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
              {countryValue}
            </span>
          </div>
        )}

        {/* ร้านค้า (Store Tour only) */}
        {isStoreTour && (
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              ร้านค้า
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
              {storeValue}
            </span>
          </div>
        )}

        {/* สถานที่จะไป (Store Tour only) */}
        {isStoreTour && (
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              สถานที่จะไป
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
              {destinationValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
