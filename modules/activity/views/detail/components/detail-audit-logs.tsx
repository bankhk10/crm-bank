"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { History, Clock, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuditLogItem {
  id: string;
  isActual: boolean;
  user: any;
  action: string;
  comment?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  createdAt: Date;
}

interface DetailAuditLogsProps {
  logs: AuditLogItem[];
}

function formatActivityResultStatus(status?: string | null): string {
  switch (status) {
    case "COMPLETED":
      return "ดำเนินการเสร็จสิ้น";
    case "POSTPONED":
      return "เลื่อนการทำกิจกรรม";
    case "CANCELLED":
      return "ยกเลิกกิจกรรม";
    case "FAILED":
      return "ไม่สำเร็จ";
    default:
      return status || "-";
  }
}

function renderAuditActionBadge(action: string) {
  switch (action) {
    case "APPROVE":
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          อนุมัติ
        </Badge>
      );
    case "REJECT":
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-red-50 text-red-700 border-red-200"
        >
          ปฏิเสธ
        </Badge>
      );
    case "REQUEST_CORRECTION":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-amber-50 text-amber-700 border-amber-200"
        >
          ส่งกลับแก้ไข
        </Badge>
      );
    case "SUBMIT":
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-blue-50 text-blue-700 border-blue-200"
        >
          ยื่นขออนุมัติ
        </Badge>
      );
    case "RECORD_ACTUAL":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          บันทึกผลงาน
        </Badge>
      );
    case "UPDATE_ACTUAL":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-blue-50 text-blue-700 border-blue-200"
        >
          แก้ไขผลงาน
        </Badge>
      );
    case "CHANGE_ACTUAL_STATUS":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-bold bg-purple-50 text-purple-700 border-purple-200"
        >
          เปลี่ยนสถานะผลงาน
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-medium bg-slate-50 text-slate-700 border-slate-200"
        >
          {action}
        </Badge>
      );
  }
}

export function DetailAuditLogs({ logs }: DetailAuditLogsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between group cursor-pointer text-left focus:outline-none transition-colors",
          isOpen && "border-b border-slate-100 pb-2.5",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/60 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
            <History className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-slate-900 transition-colors">
            ประวัติการดำเนินการ
          </h4>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 bg-slate-50 text-slate-500 font-semibold border-slate-200"
          >
            {logs.length} รายการ
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isOpen ? "ย่อ" : "ขยาย"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="space-y-2 pt-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {log.user?.name || "ผู้ใช้งาน"}
                  </span>
                  {renderAuditActionBadge(log.action)}
                </div>

                {!log.isActual ? (
                  log.comment && (
                    <div className="text-slate-600 text-xs italic bg-white p-1.5 rounded border border-slate-100 mt-1">
                      &quot;{log.comment}&quot;
                    </div>
                  )
                ) : (
                  <div className="text-slate-700 text-xs mt-1 space-y-0.5">
                    {log.action === "RECORD_ACTUAL" && (
                      <div className="font-medium">
                        บันทึกผลการทำกิจกรรม
                      </div>
                    )}
                    {log.action === "UPDATE_ACTUAL" && (
                      <div className="font-medium">
                        แก้ไขผลการทำกิจกรรม
                      </div>
                    )}
                    {log.action === "CHANGE_ACTUAL_STATUS" && (
                      <div>
                        <div className="font-medium">
                          เปลี่ยนสถานะผลการทำกิจกรรม
                        </div>
                        {log.previousStatus && log.newStatus && (
                          <div className="text-[11px] text-slate-500 font-normal">
                            {formatActivityResultStatus(log.previousStatus)} →{" "}
                            {formatActivityResultStatus(log.newStatus)}
                          </div>
                        )}
                      </div>
                    )}
                    {log.comment &&
                      log.comment !== "บันทึกผลการทำกิจกรรม" &&
                      log.comment !== "แก้ไขผลการทำกิจกรรม" &&
                      log.comment !== "เปลี่ยนสถานะผลการทำกิจกรรม" && (
                        <div className="text-slate-600 text-xs italic bg-white p-1.5 rounded border border-slate-100 mt-1">
                          &quot;{log.comment}&quot;
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center gap-1 self-start sm:self-center">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: th,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
