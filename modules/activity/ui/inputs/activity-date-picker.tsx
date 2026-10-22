"use client";

import React, { useMemo } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityDatePickerProps {
  id?: string;
  name?: string;
  label?: string;
  labelClassName?: string;
  value?: string | Date | null;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export const ActivityDatePicker = React.forwardRef<
  HTMLInputElement,
  ActivityDatePickerProps
>(
  (
    {
      id,
      name,
      label,
      labelClassName = "block text-xs font-semibold text-slate-700 mb-1 mx-0",
      value,
      onChange,
      placeholder = "เลือกวันที่...",
      disabled = false,
      readonly = false,
      required = false,
      error,
      min,
      max,
      className,
    },
    ref,
  ) => {
    // Normalize date value to YYYY-MM-DD
    const normalizedValue = useMemo(() => {
      if (!value) return "";
      if (typeof value === "string") {
        return value.includes("T") ? value.split("T")[0] : value;
      }
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split("T")[0];
      }
      return "";
    }, [value]);

    const isInteractive = !disabled && !readonly;

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (isInteractive && onChange) {
        onChange("");
      }
    };

    return (
      <div className={cn("space-y-1 w-full", className)}>
        {label && (
          <label htmlFor={id} className={labelClassName}>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <input
            ref={ref}
            id={id}
            name={name}
            type="date"
            value={normalizedValue}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            readOnly={readonly}
            required={required}
            min={min}
            max={max}
            placeholder={placeholder}
            className={cn(
              "w-full h-9 min-h-[36px] pl-9 pr-8 py-1.5",
              "rounded-lg border border-slate-200 bg-white shadow-2xs",
              "text-xs text-slate-800 placeholder:text-slate-400 font-normal",
              "transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-offset-0 focus-visible:outline-none",
              error && "border-rose-300 focus-visible:ring-rose-500 focus-visible:border-rose-500",
              (disabled || readonly) &&
                "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none",
            )}
          />

          <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />

          {isInteractive && normalizedValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="ล้างวันที่"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {error && <p className="text-[11px] text-rose-500 font-medium pt-0.5">{error}</p>}
      </div>
    );
  },
);

ActivityDatePicker.displayName = "ActivityDatePicker";

