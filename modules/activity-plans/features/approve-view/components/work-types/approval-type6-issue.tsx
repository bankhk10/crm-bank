"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType6IssueProps {
  isVisible: boolean;
  target: ActualTargetsState["t6"];
}

export function ApprovalType6Issue({
  isVisible,
  target,
}: ApprovalType6IssueProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-red-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-red-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-red-900 text-sm sm:text-base">
            ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-red-50 text-red-800 border-red-200"
        >
          TYPE_6
        </Badge>
      </div>

      {target.items && target.items.length > 1 ? (
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-700 block">
            รายการเป้าหมาย ({target.items.length} รายการ):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {target.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1.5"
              >
                <div className="font-bold text-red-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-[10px] font-extrabold">
                    {idx + 1}
                  </span>
                  ลูกค้า: {item.customer || "-"}
                </div>
                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      ประเภทปัญหา:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.issueType || "-"}
                    </span>
                  </div>
                  {item.detail && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        รายละเอียด:
                      </span>
                      <span className="font-medium text-slate-700 block break-words whitespace-pre-wrap">
                        {item.detail}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-red-50/40 p-3 rounded-xl border border-red-100/80 sm:col-span-1">
            <span className="text-red-700 block text-[11px] font-bold mb-1">
              วัตถุประสงค์ของประเภทงาน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              ตรวจสอบเรื่องร้องเรียนและแก้ปัญหาให้กับลูกค้า
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ลูกค้า / ผู้ร้องเรียน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.customer || "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ประเภทเรื่องร้องเรียน
            </span>
            <span className="font-bold text-red-700 block text-xs sm:text-sm">
              {target.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย"}
            </span>
          </div>

          {target.detail && (
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-3">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                รายละเอียดปัญหา
              </span>
              <span className="text-slate-700 block text-xs whitespace-pre-line">
                {target.detail}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
