"use client";

import React from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "../../../types";

interface HelpersSectionProps {
  helpers: ActivityPlanWithRelations["helpers"];
}

export function HelpersSection({ helpers }: HelpersSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-purple-500" />
          พนักงานช่วยงาน ({helpers.length} คน)
        </h3>
      </div>

      {helpers.length === 0 ? (
        <p className="text-xs text-slate-400 italic p-4">ไม่มีพนักงานช่วยงาน</p>
      ) : (
        <div className="divide-y">
          {helpers.map((helper, idx) => (
            <div
              key={helper.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block">
                  {idx + 1}. {helper.employee.name}
                </span>
                <span className="text-slate-500">
                  {helper.employee.positionTitle || "-"} •{" "}
                  {helper.employee.departmentName ||
                    helper.departmentName ||
                    "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold",
                    helper.status === "APPROVED" &&
                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                    helper.status === "PENDING" &&
                      "bg-amber-50 text-amber-700 border-amber-200",
                    helper.status === "REJECTED" &&
                      "bg-red-50 text-red-700 border-red-200",
                  )}
                >
                  {helper.status === "APPROVED" && "อนุมัติแล้ว"}
                  {helper.status === "PENDING" && "รออนุมัติ"}
                  {helper.status === "REJECTED" && "ปฏิเสธ"}
                </Badge>
                {helper.rejectionReason && (
                  <span
                    className="text-red-500 font-medium max-w-[140px] truncate text-[10px]"
                    title={helper.rejectionReason}
                  >
                    {helper.rejectionReason}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
