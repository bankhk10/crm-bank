"use client";

import React from "react";
import { AlertTriangle, User, AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Type6PlanCardTargetItem {
  id?: string;
  customer?: string;
  customerName?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type6PlanCardTarget {
  customer?: string;
  issueType?: string;
  detail?: string;
  notes?: string;
  items?: Type6PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type6PlanCardProps {
  planType?: string;
  target?: Type6PlanCardTarget | null;
  className?: string;
}

export function Type6PlanCard({
  planType,
  target,
  className,
}: Type6PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  // Normalize issue items
  const issueItems: Type6PlanCardTargetItem[] =
    target.items && target.items.length > 0
      ? target.items
      : target.customer || target.issueType
        ? [
            {
              id: "i-0",
              customer: target.customer,
              issueType: target.issueType,
              detail: target.detail || target.notes,
            },
          ]
        : [];

  const mainCustomer =
    target.customer ||
    issueItems
      .map((it) => it.customer || it.customerName || it.storeName)
      .filter(Boolean)
      .join(", ") ||
    "-";

  const mainIssueType =
    target.issueType ||
    issueItems[0]?.issueType ||
    "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";

  const isDetailDuplicate =
    issueItems.length === 1 &&
    Boolean(target.detail) &&
    (issueItems[0].detail === target.detail ||
      issueItems[0].notes === target.detail);

  return (
    <div
      className={cn(
        "bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs",
        className,
      )}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER: Item Title & Plan Badge */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold shrink-0">
            1
          </span>
          <h4 className="font-bold text-indigo-950 text-sm sm:text-base truncate">
            รายการตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
          </h4>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          ข้อมูลตามแผนงาน (PLAN)
        </span>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: ข้อมูลทั่วไป & วัตถุประสงค์ (Flat Clean Grid) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* วัตถุประสงค์ของประเภทงาน */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>ตรวจสอบเรื่องร้องเรียนและแก้ปัญหา</span>
          </div>
        </div>

        {/* ลูกค้า / ผู้ร้องเรียน */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            ลูกค้า / ผู้ร้องเรียน
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate" title={mainCustomer}>
              {mainCustomer}
            </span>
          </div>
        </div>

        {/* ประเภทเรื่องร้องเรียน */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            ประเภทเรื่องร้องเรียน
          </span>
          <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate" title={mainIssueType}>
              {mainIssueType}
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายการเป้าหมายตามแผน (กรณีมีหลายรายการ) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {issueItems.length > 1 && (
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>รายการเป้าหมายตามแผน</span>
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              {issueItems.length} รายการ
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {issueItems.map((item, idx) => {
              const itemCustomer =
                item.customer || item.customerName || item.storeName || "-";
              const itemType = item.issueType || "-";
              const itemNotes = item.detail || item.notes;

              return (
                <div
                  key={item.id || idx}
                  className="py-2.5 first:pt-1 last:pb-0 space-y-1.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <span
                          className="font-bold text-slate-900 text-xs sm:text-sm break-words block"
                          title={itemCustomer}
                        >
                          ลูกค้า: {itemCustomer}
                        </span>
                        <span className="text-rose-700 font-medium text-[11px] block">
                          ประเภท: {itemType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {itemNotes && (
                    <div className="pl-6 text-xs">
                      <div className="text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                        <span className="text-slate-400 font-medium block text-[10px]">
                          รายละเอียดปัญหา:
                        </span>
                        {itemNotes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายละเอียดเพิ่มเติม (ภาพรวมแผนงาน) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {target.detail && !isDetailDuplicate && (
        <div className="pt-2.5 border-t border-slate-100 space-y-1 text-xs">
          <span className="text-slate-400 font-medium block text-[11px]">
            รายละเอียดปัญหา (จากแผนงาน)
          </span>
          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap break-words">
            {target.detail}
          </div>
        </div>
      )}
    </div>
  );
}
