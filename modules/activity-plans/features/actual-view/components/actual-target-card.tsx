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
  badgeText = "จากแผนฉบับเดิม",
  badgeColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200",
  gridColsClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
}: ActualTargetCardProps) {
  return (
    <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Target className={cn("w-3.5 h-3.5", iconColorClass)} />
          เป้าหมายที่ตั้งไว้ล่วงหน้าของแผน (Planned Target)
        </span>
        <span
          className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded",
            badgeColorClass
          )}
        >
          {badgeText}
        </span>
      </div>
      <div className={cn("grid gap-2.5 text-xs", gridColsClass)}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs",
              item.colSpan
            )}
          >
            <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
              {item.label}
            </span>
            <span
              className={cn(
                "font-bold block break-words whitespace-pre-wrap text-slate-800 text-xs",
                item.highlight ? "text-emerald-700 font-extrabold" : "text-slate-800"
              )}
            >
              {item.value || "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
