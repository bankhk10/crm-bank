"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, MapPin, Users, User, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../types/calendar.types";

interface CalendarEventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export function CalendarEventModal({ event, onClose }: CalendarEventModalProps) {
  const router = useRouter();

  if (!event) return null;

  const isUnplanned = event.activityPlan?.planType === "UNPLANNED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  event.status === "COMPLETED" &&
                    "bg-emerald-50 text-emerald-700 border-emerald-200",
                  event.status === "SCHEDULED" &&
                    "bg-blue-50 text-blue-700 border-blue-200",
                  event.status === "CANCELLED" &&
                    "bg-red-50 text-red-700 border-red-200",
                )}
              >
                {event.status === "COMPLETED"
                  ? "ดำเนินการเสร็จสิ้น"
                  : event.status === "SCHEDULED"
                    ? "มีนัดหมายตามกำหนด"
                    : "ยกเลิกนัดหมาย"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  isUnplanned
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200",
                )}
              >
                {isUnplanned ? "นอกแผน" : "ตามแผน"}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
            {event.activityPlan?.code && (
              <p className="text-xs text-slate-400 font-mono">
                รหัส: {event.activityPlan.code}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <XCircle className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        {/* Date & Time */}
        <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              <strong>เวลา:</strong>{" "}
              {format(new Date(event.startDate), "d MMMM yyyy HH:mm", {
                locale: th,
              })}{" "}
              -{" "}
              {format(new Date(event.endDate), "HH:mm น.", {
                locale: th,
              })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>สถานที่:</strong> {event.location}
                {event.district && ` อ.${event.district}`}
                {event.province && ` จ.${event.province}`}
              </span>
            </div>
          )}
          {event.employee && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500 shrink-0" />
              <span>
                <strong>ผู้สร้างแผนงาน:</strong> {event.employee.name} (
                {event.employee.positionTitle || "พนักงาน"})
              </span>
            </div>
          )}
        </div>

        {/* Attendees / Helpers */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              รายชื่อผู้เข้าร่วมและผู้ช่วยงาน ({event.attendees.length} คน)
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {event.attendees.map((att: any, idx: number) => (
                <div
                  key={att.id || idx}
                  className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {att.employee?.name || "พนักงาน"}
                    </span>
                    <span className="text-slate-400">
                      (
                      {att.employee?.positionTitle ||
                        att.employee?.departmentName ||
                        "พนักงาน"}
                      )
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      att.role === "CREATOR"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700",
                    )}
                  >
                    {att.role === "CREATOR" ? "ผู้สร้างแผน" : "ผู้ช่วยงาน"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            ปิด
          </Button>
          {event.activityPlanId && (
            <Button
              onClick={() => router.push(`/activity-plans/${event.activityPlanId}`)}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              ดูรายละเอียดแผนงาน
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

