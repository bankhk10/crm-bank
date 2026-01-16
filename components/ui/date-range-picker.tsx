"use client";

import * as React from "react";
import { CalendarRange, RotateCcw } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DateRangePreset = {
  label: string;
  range: () => DateRange;
};

export interface DateRangePickerProps {
  value?: DateRange | null;
  onChange?: (range: DateRange | undefined) => void;
  // Alternative props for convenience
  from?: Date;
  to?: Date;
  onSelect?: (range: DateRange | undefined) => void;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
  className?: string;
  presets?: DateRangePreset[];
}

const defaultPresets: DateRangePreset[] = [
  {
    label: "7 วันที่ผ่านมา",
    range: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "30 วันที่ผ่านมา",
    range: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "เดือนนี้",
    range: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "ปีนี้",
    range: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  from,
  to,
  onSelect,
  placeholder = "เลือกช่วงวันที่",
  disabled,
  className,
  presets = defaultPresets,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Support both "value/onChange" and "from/to/onSelect" patterns
  const resolvedValue: DateRange | undefined =
    value ?? (from && to ? { from, to } : from ? { from } : undefined);
  const handleChange = onChange ?? onSelect;

  const hasSelection = Boolean(resolvedValue?.from && resolvedValue?.to);

  const displayText = React.useMemo(() => {
    const formatPart = (date?: Date) =>
      date?.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    if (resolvedValue?.from && resolvedValue?.to) {
      return `${formatPart(resolvedValue.from)} - ${formatPart(
        resolvedValue.to
      )}`;
    }

    if (resolvedValue?.from) {
      return `${formatPart(resolvedValue.from)} - ไม่กำหนด`;
    }

    return placeholder;
  }, [placeholder, resolvedValue]);

  const handleSelectRange = (range: DateRange | undefined) => {
    handleChange?.(range);
  };

  const handleReset = () => {
    handleChange?.(undefined);
  };

  const handleConfirm = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 min-w-[220px] justify-start gap-2 rounded-xl border-slate-200 px-4 text-sm font-medium",
            !hasSelection && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-4 truncate">
            <CalendarRange className="h-4 w-4" />
            <span className="truncate mt-1" title={displayText}>
              {hasSelection ? displayText : placeholder}
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[290px] space-y-4 p-4" align="end">
        {presets.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full text-xs"
                onClick={() => handleSelectRange(preset.range())}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
        <Calendar
          initialFocus
          mode="range"
          numberOfMonths={1}
          selected={resolvedValue}
          onSelect={handleSelectRange}
        />
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> ล้างช่วงวันที่
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm}>
            ยืนยัน
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
