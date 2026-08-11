"use client";

import React from "react";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActualTargetItem } from "../types";

interface ActualTargetCardProps {
  items: ActualTargetItem[];
  iconColorClass?: string;
  badgeText?: string;
  badgeColorClass?: string;
  gridColsClass?: string;
}

export function ActualTargetCard({
  items,
  iconColorClass = "text-emerald-600",
  badgeText = "จากฟอร์มสร้างแผน",
  badgeColorClass = "bg-emerald-100 text-emerald-800",
  gridColsClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
}: ActualTargetCardProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Target className={cn("w-4 h-4", iconColorClass)} />
          เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
        </span>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            badgeColorClass
          )}
        >
          {badgeText}
        </span>
      </div>
      <div className={cn("grid gap-2 text-xs", gridColsClass)}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "bg-white p-2 rounded-lg border border-slate-200/60",
              item.colSpan
            )}
          >
            <span className="text-slate-400 block text-[10px]">
              {item.label}
            </span>
            <span
              className={cn(
                "font-bold",
                item.highlight ? "text-emerald-700" : "text-slate-900"
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
