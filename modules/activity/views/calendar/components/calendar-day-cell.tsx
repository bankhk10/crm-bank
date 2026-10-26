"use client";

import React from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../types/calendar.types";

interface CalendarDayCellProps {
  day: Date;
  currentDate: Date;
  events: CalendarEvent[];
  onSelectDay: (day: Date, events: CalendarEvent[]) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarDayCell({
  day,
  currentDate,
  events,
  onSelectDay,
  onSelectEvent,
}: CalendarDayCellProps) {
  const isCurrentMonth = isSameMonth(day, currentDate);
  const isDayToday = isToday(day);

  return (
    <div
      onClick={() => {
        if (events.length > 0) {
          onSelectDay(day, events);
        }
      }}
      className={cn(
        "min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 bg-white flex flex-col justify-between transition-colors",
        !isCurrentMonth && "bg-slate-50/70 text-slate-300",
        isDayToday && "bg-blue-50/40",
        events.length > 0 && "cursor-pointer hover:bg-slate-50/90",
      )}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
            isDayToday
              ? "bg-blue-600 text-white font-bold"
              : isCurrentMonth
                ? "text-slate-700"
                : "text-slate-400",
          )}
        >
          {format(day, "d")}
        </span>
        {events.length > 0 && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md sm:hidden">
            {events.length}
          </span>
        )}
      </div>

      {/* Event Tags */}
      <div className="space-y-1 mt-1 flex-1 overflow-hidden">
        {events.slice(0, 3).map((ev) => {
          const isUnplanned = ev.activityPlan?.planType === "UNPLANNED";
          return (
            <div
              key={ev.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent(ev);
              }}
              className={cn(
                "text-[11px] font-medium px-1.5 py-0.5 rounded-md truncate cursor-pointer transition-all border",
                ev.status === "CANCELLED"
                  ? "bg-red-50 text-red-600 border-red-200 line-through"
                  : ev.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : isUnplanned
                      ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      : "bg-blue-50/90 text-blue-700 border-blue-200 hover:bg-blue-100",
              )}
            >
              <span className="font-semibold">
                {format(new Date(ev.startDate), "HH:mm")}
              </span>{" "}
              {isUnplanned && (
                <span className="font-bold text-[10px] mr-0.5 text-purple-600">
                  [นอกแผน]
                </span>
              )}
              {ev.title}
            </div>
          );
        })}
        {events.length > 3 && (
          <div className="text-[10px] text-slate-500 font-medium text-center">
            +{events.length - 3} เพิ่มเติม
          </div>
        )}
      </div>
    </div>
  );
}

