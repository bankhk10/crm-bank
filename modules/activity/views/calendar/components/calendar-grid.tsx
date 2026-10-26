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
    </Card>
  );
}

