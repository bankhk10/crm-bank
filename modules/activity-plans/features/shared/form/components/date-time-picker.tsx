"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, Clock } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { th } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

interface TimePickerPanelProps {
  currentHour: string;
  currentMinute: string;
  onSelectTime: (time: string) => void;
}

function TimePickerPanel({
  currentHour,
  currentMinute,
  onSelectTime,
}: TimePickerPanelProps) {
  return (
    <div className="p-3 flex flex-col justify-start">
      <div className="grid grid-cols-2 text-[12px] font-medium text-slate-500 mb-2 text-center">
        <span>ชั่วโมง</span>
        <span>นาที</span>
      </div>

      <div className="flex gap-1.5 flex-1 max-h-[280px]">
        {/* Hours Column */}
        <div className="w-14 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {HOURS.map((h) => {
            const isSelected = currentHour === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => onSelectTime(`${h}:${currentMinute}`)}
                className={cn(
                  "w-full py-1.5 px-1 rounded-lg text-xs font-medium text-center transition-all",
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {h}
              </button>
            );
          })}
        </div>

        {/* Vertical Separator */}
        <div className="w-[1px] bg-slate-100" />

        {/* Minutes Column */}
        <div className="w-14 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {MINUTES.map((m) => {
            const isSelected = currentMinute === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelectTime(`${currentHour}:${m}`)}
                className={cn(
                  "w-full py-1.5 px-1 rounded-lg text-xs font-medium text-center transition-all",
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DateTimePickerProps {
  label: string;
  required?: boolean;
  dateValue: string; // YYYY-MM-DD
  timeValue: string; // HH:mm
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  readonly?: boolean;
  accentColor?: "blue" | "indigo";
}

export function DateTimePicker({
  label,
  required = false,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  readonly = false,
  accentColor = "blue",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  // "date" = step 1 (mobile only), "time" = step 2 (mobile only)
  const [mobileStep, setMobileStep] = useState<"date" | "time">("date");

  // Parse existing date or default to today
  const selectedDate = (() => {
    if (!dateValue) return new Date();
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  })();

  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);
  const [tempTime, setTempTime] = useState<string>(timeValue || "10:00");

  const isBlue = accentColor === "blue";

  // Separate hours & minutes
  const [currentHour = "10", currentMinute = "00"] = (
    tempTime || "10:00"
  ).split(":");

  // Formatted date text for trigger and preview
  const formattedPreviewText = (() => {
    const d = tempDate || selectedDate;
    if (!d || !isValid(d)) return "เลือกวันที่";

    const buddhistYear = d.getFullYear() + 543;
    const dateStr = `${format(d, "d MMM", { locale: th })} ${buddhistYear}`;

    return `${dateStr} ${tempTime || "10:00"} น.`;
  })();

  // Formatted date only (for time step header)
  const formattedDateOnly = (() => {
    const d = tempDate || selectedDate;
    if (!d || !isValid(d)) return "";
    const buddhistYear = d.getFullYear() + 543;
    return `${format(d, "d MMM", { locale: th })} ${buddhistYear}`;
  })();

  const handleOpenChange = (isOpen: boolean) => {
    if (readonly) return;
    setOpen(isOpen);
    if (isOpen) {
      setTempDate(selectedDate);
      setTempTime(timeValue || "10:00");
      setMobileStep("date"); // always reset to step 1 when opening
    }
  };

  const handleConfirm = () => {
    if (tempDate) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, "0");
      const day = String(tempDate.getDate()).padStart(2, "0");
      onDateChange(`${year}-${month}-${day}`);
    }
    if (tempTime) {
      onTimeChange(tempTime);
    }
    setOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5 ">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={readonly}
            className={cn(
              "w-full h-11 px-3.5 rounded-lg border bg-white flex items-center justify-between text-xs transition-all shadow-sm",
              open
                ? isBlue
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-indigo-500 ring-2 ring-indigo-500/20"
                : "border-slate-200 hover:border-slate-300",
              readonly && "opacity-70 bg-slate-50 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "p-1.5 rounded-lg flex items-center justify-center",
                  isBlue
                    ? "bg-blue-50 text-blue-600"
                    : "bg-indigo-50 text-indigo-600",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="font-medium text-slate-800 text-xs block">
                  {formattedPreviewText}
                </span>
              </div>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto p-0 rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden bg-white z-50"
        >
          {/* ─── MOBILE: 2-step flow ─── */}
          <div className="sm:hidden">
            {mobileStep === "date" ? (
              /* Step 1: Calendar */
              <>
                {/* Step indicator header */}
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    เลือกวัน
                  </span>
                  <span className="text-[11px] text-slate-400">ขั้นที่ 1/2</span>
                </div>

                <div className="p-3 pt-1">
                  <Calendar
                    mode="single"
                    selected={tempDate}
                    onSelect={(d) => {
                      if (d) {
                        setTempDate(d);
                        // Auto-advance to time step after selecting a date
                        setMobileStep("time");
                      }
                    }}
                    initialFocus
                    className="rounded-xl border-0 p-1"
                  />
                </div>

                {/* Footer: Cancel only */}
                <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-6 py-1.5 rounded-xl border border-slate-300 bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
                  >
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Time Picker */
              <>
                {/* Step indicator header with Back button */}
                <div className="px-3 pt-3 pb-2 flex items-center gap-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMobileStep("date")}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      เลือกเวลา
                    </span>
                    {formattedDateOnly && (
                      <span className="text-[11px] text-slate-400 block">
                        {formattedDateOnly}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">ขั้นที่ 2/2</span>
                </div>

                <TimePickerPanel
                  currentHour={currentHour}
                  currentMinute={currentMinute}
                  onSelectTime={setTempTime}
                />

                {/* Footer: Back + Confirm */}
                <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setMobileStep("date")}
                    className="px-4 py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="px-4 py-1.5 rounded-xl border border-slate-300 bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
                  >
                    ตกลง
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ─── DESKTOP: Side-by-side layout (unchanged) ─── */}
          <div className="hidden sm:flex items-stretch">
            {/* Left: Calendar Picker */}
            <div className="p-3">
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={(d) => {
                  if (d) setTempDate(d);
                }}
                initialFocus
                className="rounded-xl border-0 p-1"
              />
            </div>

            {/* Vertical Divider Line */}
            <div className="w-[1px] bg-slate-100 my-3" />

            {/* Right: Time Picker */}
            <TimePickerPanel
              currentHour={currentHour}
              currentMinute={currentMinute}
              onSelectTime={setTempTime}
            />
          </div>

          {/* ─── DESKTOP: Footer ─── */}
          <div className="hidden sm:flex p-3 bg-slate-50/60 border-t border-slate-100 items-center gap-4 justify-center">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
            >
              ตกลง
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
