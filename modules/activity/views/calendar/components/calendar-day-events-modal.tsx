"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent, DayEventsSelection } from "../types/calendar.types";

interface CalendarDayEventsModalProps {
  selection: DayEventsSelection | null;
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarDayEventsModal({
  selection,
  onClose,
  onSelectEvent,
}: CalendarDayEventsModalProps) {
  if (!selection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-base font-bold text-slate-900">
            กิจกรรมวันที่{" "}
            {format(selection.day, "d MMMM yyyy", { locale: th })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
          </Button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {selection.events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                onClose();
                onSelectEvent(ev);
              }}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-bold text-xs",
                    ev.status === "CANCELLED"
                      ? "text-red-600 line-through"
                      : ev.status === "COMPLETED"
                        ? "text-emerald-700"
                        : "text-slate-900",
                  )}
                >
                  {ev.activityPlan?.planType === "UNPLANNED" && (
                    <span className="text-purple-600 font-semibold mr-1">
                      [นอกแผน]
                    </span>
                  )}
                  {ev.title}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    ev.status === "CANCELLED"
                      ? "text-red-500"
                      : ev.status === "COMPLETED"
                        ? "text-emerald-600"
                        : "text-blue-600",
                  )}
                >
                  {format(new Date(ev.startDate), "HH:mm")} น.
                </span>
              </div>
              {ev.location && (
                <p className="text-xs text-slate-500 truncate">
                  📍 {ev.location}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

