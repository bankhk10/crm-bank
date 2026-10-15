"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { History, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApprovalAuditLogsProps {
  logs: any[];
}

function renderAuditActionBadge(action: string) {
  switch (action) {
    case "APPROVE":
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          อนุมัติ
        </Badge>
      );
    case "REJECT":
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 font-bold bg-red-50 text-red-700 border-red-200"
        >
          ปฏิเสธ
        </Badge>
      );
    case "REQUEST_CORRECTION":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 font-bold bg-amber-50 text-amber-700 border-amber-200"
        >
          ส่งกลับแก้ไข
        </Badge>
      );
    case "SUBMIT":
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 font-bold bg-blue-50 text-blue-700 border-blue-200"
        >
          ยื่นขออนุมัติ
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 font-medium bg-slate-50 text-slate-700 border-slate-200"
        >
          {action}
        </Badge>
      );
  }
}

export function ApprovalAuditLogs({ logs }: ApprovalAuditLogsProps) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
          <History className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            ประวัติการดำเนินการ (Approval Audit Logs)
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            บันทึกประวัติการส่งแผนงาน พิจารณา และอนุมัติตามลำดับขั้นตอน
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {logs.map((log: any) => (
          <div
            key={log.id}
            className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  {log.user?.name || "ผู้ใช้งาน"}
                </span>
                {renderAuditActionBadge(log.action)}
              </div>
              {log.comment && (
                <div className="text-slate-600 text-xs italic bg-slate-50/80 p-2 rounded-lg border border-slate-100 mt-1">
                  &quot;{log.comment}&quot;
                </div>
              )}
            </div>
            <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center gap-1.5 self-end sm:self-center">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm น.", {
                  locale: th,
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
