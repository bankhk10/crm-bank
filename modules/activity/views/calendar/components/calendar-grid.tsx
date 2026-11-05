"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../types/calendar.types";
import { CalendarDayCell } from "./calendar-day-cell";

const DAYS_OF_WEEK = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

interface CalendarGridProps {
  calendarDays: Date[];
  currentDate: Date;
  getEventsForDay: (day: Date) => CalendarEvent[];
  onSelectDay: (day: Date, events: CalendarEvent[]) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarGrid({
  calendarDays,
  currentDate,
  getEventsForDay,
  onSelectDay,
  onSelectEvent,
}: CalendarGridProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
        {DAYS_OF_WEEK.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-2.5 text-xs font-bold",
              i === 0
                ? "text-red-500"
                : i === 6
                  ? "text-blue-600"
                  : "text-slate-600",
            )}
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.slice(0, 2)}</span>
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-[1px]">
        {calendarDays.map((day) => {
          const dayEvents = getEventsForDay(day);

          return (
            <CalendarDayCell
              key={day.toISOString()}
              day={day}
              currentDate={currentDate}
              events={dayEvents}
              onSelectDay={onSelectDay}
              onSelectEvent={onSelectEvent}
            />
          );
        })}
      </div>

      {/* Calendar Color Legend (คำอธิบายสีแต่ละประเภทในปฏิทิน) */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 px-4 py-3 bg-slate-50/90 border-t border-slate-200 text-xs text-slate-600">
        <span className="font-semibold text-slate-500 shrink-0">คำอธิบายสี:</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]">
          <span>มีนัดหมายตามกำหนด</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
          <span>ดำเนินการเสร็จสิ้น</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium text-[11px]">
          <span className="font-bold text-[10px]">[นอกแผน]</span>
          <span>กิจกรรมนอกแผน</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-300 font-medium text-[11px]">
          <span className="font-bold text-[10px]">[เลื่อนนัด]</span>
          <span>เลื่อนนัดหมาย</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 font-medium text-[11px] line-through">
          <span>ยกเลิกนัดหมาย</span>
        </div>
      </div>
    </Card>
  );
}

