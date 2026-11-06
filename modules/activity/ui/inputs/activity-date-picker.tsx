"use client";

import React, { useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  min?: string | Date;
  max?: string | Date;
  className?: string;
  triggerClassName?: string;
  showBuddhistYear?: boolean;
}

const defaultLabelClass = "block text-xs font-semibold text-slate-700 mb-1 mx-0";

/**
 * ActivityDatePicker
 *
 * Beautified modern Date Picker component for Activity Plan forms.
 * Features:
 * - Popover calendar with Thai locale and Buddhist Era (พ.ศ.) support
 * - Clean trigger button with calendar icon, clear button, and smooth transitions
 * - "วันนี้" (Today) quick selector button
 * - Formats output as standard ISO "YYYY-MM-DD"
 */
export function ActivityDatePicker({
  id,
  name,
  label,
  labelClassName = defaultLabelClass,
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
  triggerClassName,
  showBuddhistYear = true,
}: ActivityDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Normalize input value into Date object
  const selectedDate: Date | undefined = useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) {
      return isValid(value) ? value : undefined;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = parseISO(trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`);
      return isValid(parsed) ? parsed : undefined;
    }
    return undefined;
  }, [value]);

  // Normalize min / max
  const minDate = useMemo(() => {
    if (!min) return undefined;
    return min instanceof Date ? min : parseISO(String(min));
  }, [min]);

  const maxDate = useMemo(() => {
    if (!max) return undefined;
    return max instanceof Date ? max : parseISO(String(max));
  }, [max]);

  // Formatted display text
  const displayLabel = useMemo(() => {
    if (!selectedDate) return "";
    try {
      if (showBuddhistYear) {
        const dayStr = format(selectedDate, "d MMM", { locale: th });
        const bYear = selectedDate.getFullYear() + 543;
        return `${dayStr} ${bYear}`;
      }
      return format(selectedDate, "d MMM yyyy", { locale: th });
    } catch {
      return format(selectedDate, "yyyy-MM-dd");
    }
  }, [selectedDate, showBuddhistYear]);

  const isInteractive = !disabled && !readonly;

  const handleSelectDate = (date: Date | undefined) => {
    if (!isInteractive) return;
    if (date && isValid(date)) {
      const ymd = format(date, "yyyy-MM-dd");
      onChange?.(ymd);
    } else {
      onChange?.("");
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isInteractive) {
      onChange?.("");
    }
  };

  const handleSelectToday = () => {
    if (!isInteractive) return;
    const today = new Date();
    onChange?.(format(today, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <Label htmlFor={id} className={cn(defaultLabelClass, labelClassName)}>
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </Label>
      )}

      {/* Hidden input for HTML form compatibility if name provided */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
        />
      )}

      <div className="relative flex items-center w-full">
        <Popover open={open} onOpenChange={isInteractive ? setOpen : undefined}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={!isInteractive}
              className={cn(
                "w-full h-9 min-h-[36px] justify-between pl-3 pr-8 py-1.5",
                "rounded-lg border border-slate-200 bg-white shadow-2xs",
                "text-xs font-normal text-slate-800 transition-all duration-150",
                "hover:border-slate-300 hover:bg-slate-50/50",
                "focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-0",
                !selectedDate && "text-slate-400 font-normal",
                error && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-500/20 bg-rose-50/10",
                !isInteractive &&
                  "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed hover:bg-slate-100 select-none",
                triggerClassName
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <CalendarIcon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    selectedDate ? "text-emerald-600" : "text-slate-400"
                  )}
                />
                <span className="truncate">
                  {selectedDate ? displayLabel : placeholder}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-60 shrink-0" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-0 z-50 rounded-2xl shadow-xl border border-slate-200 bg-white overflow-hidden"
            align="start"
            sideOffset={4}
          >
            {/* Calendar Widget */}
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabled={(date) => {
                  if (minDate && date < minDate) return true;
                  if (maxDate && date > maxDate) return true;
                  return false;
                }}
                initialFocus
              />
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectToday}
                className="h-7 text-xs text-emerald-700 hover:bg-emerald-100/60 font-semibold px-2.5 rounded-lg"
              >
                วันนี้
              </Button>

              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectDate(undefined)}
                  className="h-7 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-medium px-2.5 rounded-lg"
                >
                  ล้างค่า
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Button right inside the input field */}
        {isInteractive && selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            title="ล้างวันที่"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium pt-0.5">{error}</p>}
    </div>
  );
}
