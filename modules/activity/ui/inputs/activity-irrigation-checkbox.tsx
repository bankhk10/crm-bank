"use client";

import React, { useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_IRRIGATION_OPTIONS = [
  "น้ำหยด",
  "สายยาง",
  "สปิงเกอร์",
  "ให้ตามร่อง",
  "ปล่อยท่วม(flooding)",
  "รอน้ำฝน",
  "นาหว่านน้ำตม",
  "นาดำ",
] as const;

export interface ActivityIrrigationCheckboxProps {
  id?: string;
  label?: string;
  labelClassName?: string;
  value?: string[];
  onChange?: (values: string[]) => void;
  options?: readonly string[] | string[];
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export function ActivityIrrigationCheckbox({
  id = "activity-irrigation-checkbox",
  label = "ระบบน้ำ (เลือกได้มากกว่า 1 ข้อ)",
  labelClassName = "block text-xs font-semibold text-slate-700 mb-1.5 mx-0",
  value = [],
  onChange,
  options = DEFAULT_IRRIGATION_OPTIONS,
  disabled = false,
  readonly = false,
  error,
  required = false,
  className,
}: ActivityIrrigationCheckboxProps) {
  const isInteractive = !disabled && !readonly;

  const handleToggle = useCallback(
    (option: string) => {
      if (!isInteractive || !onChange) return;
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(option)) {
        onChange(currentValues.filter((v) => v !== option));
      } else {
        onChange([...currentValues, option]);
      }
    },
    [isInteractive, onChange, value],
  );

  return (
    <div id={id} className={cn("space-y-1.5", className)}>
      {label && (
        <label className={labelClassName}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((option) => {
          const isSelected = Array.isArray(value) && value.includes(option);

          return (
            <button
              key={option}
              type="button"
              disabled={!isInteractive}
              onClick={() => handleToggle(option)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all duration-150",
                "select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                isSelected
                  ? "bg-emerald-50/70 border-emerald-500 text-emerald-900 shadow-2xs font-semibold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
                !isInteractive && "cursor-default opacity-80 hover:bg-white hover:border-slate-200",
                disabled && "opacity-50 cursor-not-allowed bg-slate-50",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-slate-300 bg-white",
                  !isInteractive && isSelected && "bg-emerald-500 border-emerald-500",
                )}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="truncate">{option}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium pt-0.5">{error}</p>}
    </div>
  );
}

