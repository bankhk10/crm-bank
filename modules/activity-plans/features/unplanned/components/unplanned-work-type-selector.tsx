"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UNPLANNED_WORK_TYPE_ITEMS,
  type UnplannedWorkTypeCode,
} from "../constants";

interface UnplannedWorkTypeSelectorProps {
  selectedWorkType: string;
  onSelectWorkType: (code: UnplannedWorkTypeCode) => void;
  disabled?: boolean;
}

export function UnplannedWorkTypeSelector({
  selectedWorkType,
  onSelectWorkType,
  disabled = false,
}: UnplannedWorkTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          ประเภทกิจกรรมนอกแผนงาน <span className="text-red-500">*</span>
        </label>
        <span className="text-xs text-slate-400">
          (เลือกประเภทงานที่ได้ปฏิบัติจริง)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {UNPLANNED_WORK_TYPE_ITEMS.map((item) => {
          const isSelected = selectedWorkType === item.code;
          return (
            <button
              key={item.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelectWorkType(item.code)}
              className={cn(
                "relative text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-1.5",
                disabled && "opacity-60 cursor-not-allowed",
                isSelected
                  ? "bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/20"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] font-bold px-2 py-0.5",
                      item.badgeClass,
                    )}
                  >
                    {item.code.replace("_", " ")}
                  </Badge>
                  <span className="font-bold text-xs text-slate-800">
                    {item.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
