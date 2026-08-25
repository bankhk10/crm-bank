"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "../../../types";

interface ApprovalHistoryProps {
  logs: ActivityPlanWithRelations["approvalLogs"];
}

export function ApprovalHistory({ logs }: ApprovalHistoryProps) {
  const [showAllLogs, setShowAllLogs] = useState(false);

  const sortedLogs = [...logs].reverse();
  const visibleLogs = showAllLogs ? sortedLogs : sortedLogs.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          ประวัติการอนุมัติ
        </h3>
      </div>

      <div className="p-4">
        <div className="relative pl-5 border-l-2 border-slate-100 space-y-4">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลประวัติ</p>
          ) : (
            <>
              {visibleLogs.map((log) => {
                let badgeColor = "bg-slate-400";
                if (log.action === "APPROVE") badgeColor = "bg-emerald-500";
                if (log.action === "REJECT") badgeColor = "bg-red-500";
                if (log.action === "REQUEST_CORRECTION")
                  badgeColor = "bg-amber-500";
                if (log.action === "SUBMIT") badgeColor = "bg-blue-500";

                let actionText = log.action as string;
                if (log.action === "SUBMIT") actionText = "ยื่นคำขออนุมัติ";
                if (log.action === "APPROVE") actionText = "อนุมัติแล้ว";
                if (log.action === "REJECT") actionText = "ปฏิเสธแผน";
                if (log.action === "REQUEST_CORRECTION")
                  actionText = "ส่งกลับให้แก้ไข";
                if (log.action === "CANCEL") actionText = "ยกเลิกคำขอ";

                let stepText = log.step as string;
                if (log.step === "LINE_APPROVAL") stepText = "สายงาน";
                if (log.step === "BUDGET_APPROVAL") stepText = "งบประมาณ";
                if (log.step === "HELPER_APPROVAL") stepText = "คนช่วยงาน";

                return (
                  <div key={log.id} className="relative text-xs">
                    <span
                      className={cn(
                        "absolute -left-[27px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ring-2 ring-slate-100",
                        badgeColor,
                      )}
                    />
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {actionText}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {format(new Date(log.createdAt), "dd MMM HH:mm", {
                          locale: th,
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {stepText ? `${stepText} • ` : ""}โดย {log.user.name}
                    </div>
                    {log.comment && (
                      <div className="mt-1 p-2 bg-slate-50 rounded text-slate-700 border border-slate-100 text-[11px] font-medium">
                        &ldquo;{log.comment}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
              {sortedLogs.length > 3 && !showAllLogs && (
                <button
                  type="button"
                  onClick={() => setShowAllLogs(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  ดูเพิ่มเติม ({sortedLogs.length - 3} รายการ)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
