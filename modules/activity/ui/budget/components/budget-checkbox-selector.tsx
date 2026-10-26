"use client";

import React, { useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWorkTypeCode } from "@/modules/activity/constants";

export interface BudgetCheckboxSelectorProps {
  selectedWorkTypes?: string[];
  readonly?: boolean;
  isPromotionalMediaSelected: boolean;
  setIsPromotionalMediaSelected: (val: boolean) => void;
  isSalesPromotionSelected: boolean;
  setIsSalesPromotionSelected: (val: boolean) => void;
  marketingProductItemsCount?: number;
  onAddInitialMarketingItem?: () => void;
}

export function BudgetCheckboxSelector({
  selectedWorkTypes = [],
  readonly = false,
  isPromotionalMediaSelected,
  setIsPromotionalMediaSelected,
  isSalesPromotionSelected,
  setIsSalesPromotionSelected,
  marketingProductItemsCount = 0,
  onAddInitialMarketingItem,
}: BudgetCheckboxSelectorProps) {
  // แสดงตัวเลือก "รายการส่งเสริมการขาย" ให้ติ๊กเฉพาะเมื่อเลือกประเภทงาน:
  // TYPE_8 (จัดประชุม), TYPE_9 (จัดกิจกรรมหน้าร้าน), TYPE_10 (Field Day), TYPE_12 (ทัวร์/ดูงาน)
  const isSalesPromotionAllowed = useMemo(() => {
    if (!selectedWorkTypes || selectedWorkTypes.length === 0) return false;
    return selectedWorkTypes.some((wt) => {
      const code = getWorkTypeCode(wt);
      return (
        code === "TYPE_8" ||
        code === "TYPE_9" ||
        code === "TYPE_10" ||
        code === "TYPE_12"
      );
    });
  }, [selectedWorkTypes]);

  // หากประเภทงานที่เลือกไม่มีสิทธิ์แสดงรายการส่งเสริมการขาย ให้ยกเลิกการเลือกโดยอัตโนมัติ
  useEffect(() => {
    if (!isSalesPromotionAllowed && isSalesPromotionSelected) {
      setIsSalesPromotionSelected(false);
    }
  }, [isSalesPromotionAllowed, isSalesPromotionSelected, setIsSalesPromotionSelected]);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        isSalesPromotionAllowed ? "md:grid-cols-2" : "max-w-md",
      )}
    >
      {/* Checkbox 1: สื่อส่งเสริมการขาย */}
      <button
        type="button"
        onClick={() => {
          if (!readonly) {
            const nextVal = !isPromotionalMediaSelected;
            setIsPromotionalMediaSelected(nextVal);
            if (nextVal && marketingProductItemsCount === 0 && onAddInitialMarketingItem) {
              onAddInitialMarketingItem();
            }
          }
        }}
        className={cn(
          "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
          isPromotionalMediaSelected
            ? "bg-emerald-50/60 border-emerald-500 text-emerald-800 shadow-sm"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
        )}
      >
        <div
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
            isPromotionalMediaSelected
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-300 bg-white",
          )}
        >
          {isPromotionalMediaSelected && (
            <Check className="h-3 w-3 stroke-[3]" />
          )}
        </div>
        <span>สื่อส่งเสริมการขาย</span>
      </button>

      {/* Checkbox 2: รายการส่งเสริมการขาย (แสดงให้ติ๊กเฉพาะ TYPE_8, TYPE_9, TYPE_10, TYPE_12) */}
      {isSalesPromotionAllowed && (
        <button
          type="button"
          onClick={() =>
            !readonly && setIsSalesPromotionSelected(!isSalesPromotionSelected)
          }
          className={cn(
            "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
            isSalesPromotionSelected
              ? "bg-blue-50/60 border-blue-500 text-blue-800 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
              isSalesPromotionSelected
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white",
            )}
          >
            {isSalesPromotionSelected && (
              <Check className="h-3 w-3 stroke-[3]" />
            )}
          </div>
          <span>รายการส่งเสริมการขาย</span>
        </button>
      )}
    </div>
  );
}

