"use client";

import React from "react";
import { Boxes, Store, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Type11PlanTarget {
  store?: string;
  detail?: string;
  targetOpportunity?: string;
  items?: Array<{ storeId?: string; store?: string; storeName?: string; detail?: string }>;
  [key: string]: any;
}

export interface Type11PlanCardProps {
  target?: Type11PlanTarget;
  planType?: string;
  className?: string;
}

export function Type11PlanCard({
  target,
  planType,
  className = "",
}: Type11PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  const stores = target.items && target.items.length > 0
    ? target.items.map((i) => i.store || i.storeName).filter(Boolean)
    : target.store
      ? target.store.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const storeDisplay = stores.length > 0 ? stores.join(", ") : target.store || "";

  return (
    <div
      className={`bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <Boxes className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: ตรวจเช็กสต็อกหน้าร้าน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-700 border-slate-300 text-[11px] font-semibold px-2.5 py-0.5"
        >
          ข้อมูลตามแผนงาน (PLAN)
        </Badge>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {storeDisplay ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2 md:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายชื่อร้านค้าเป้าหมายที่ตรวจเช็กสต็อก ({stores.length > 0 ? stores.length : 1} ร้าน)
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {stores.length > 0 ? (
                stores.map((s, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white text-slate-800 border-slate-200 text-xs px-2.5 py-1 font-semibold"
                  >
                    <Store className="w-3 h-3 mr-1 text-slate-500" />
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {storeDisplay}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {target.detail ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2 md:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดเพิ่มเติม
            </span>
            <span className="font-medium text-slate-800 block text-xs whitespace-pre-wrap">
              {target.detail}
            </span>
          </div>
        ) : null}

        {target.targetOpportunity ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              โอกาสสั่งซื้อรอบใหม่
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.targetOpportunity}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
