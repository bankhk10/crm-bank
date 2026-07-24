import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { th } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

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

  // Parse existing date or default to today
  const selectedDate = (() => {
    if (!dateValue) return new Date();
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  })();

  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);
  const [tempTime, setTempTime] = useState<string>(timeValue || "10:00");

  const isBlue = accentColor === "blue";

  // Formatted date text for trigger and preview
  const formattedPreviewText = (() => {
    const d = tempDate || selectedDate;
    if (!d || !isValid(d)) return "เลือกวันที่";
    const dateStr = format(d, "d MMM yyyy", { locale: th });
    return `${dateStr} ${tempTime || "10:00"} น.`;
  })();

  const handleOpenChange = (isOpen: boolean) => {
    if (readonly) return;
    setOpen(isOpen);
    if (isOpen) {
      setTempDate(selectedDate);
      setTempTime(timeValue || "10:00");
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
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
        <CalendarIcon
          className={cn(
            "h-3.5 w-3.5",
            isBlue ? "text-blue-600" : "text-indigo-600",
          )}
        />
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={readonly}
            className={cn(
              "w-full h-11 px-3.5 rounded-xl border bg-white flex items-center justify-between text-xs transition-all shadow-sm",
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
                <span className="font-semibold text-slate-800 text-xs block">
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
          {/* Main Top Area: Calendar (Left) + Time Picker List (Right) */}
          <div className="flex items-stretch">
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

            {/* Right: Vertical Time List */}
            <div className="w-28 p-3 flex flex-col">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 px-1 text-center">
                เลือกเวลา
              </div>
              <div className="flex-1 max-h-[280px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {TIME_SLOTS.map((t) => {
                  const isSelected = tempTime === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTempTime(t)}
                      className={cn(
                        "w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all",
                        isSelected
                          ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/80 shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      {t} น.
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Footer Bar: Cancel | Preview Pill | Confirm Button */}
          <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 transition-colors"
            >
              Cancel
            </button>

            <div className="px-3 py-1 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-800 shadow-2xs">
              {formattedPreviewText}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-2xs transition-all active:scale-95"
            >
              Schedule
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
