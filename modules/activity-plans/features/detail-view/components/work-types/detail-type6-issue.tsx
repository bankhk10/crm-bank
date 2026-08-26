"use client";

import React from "react";
import { Wrench, CheckCircle2, Clock, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";

interface DetailType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus: string;
    items?: any[];
  };
  problemDetail?: string;
  initialSolution?: string;
  status?: "เสร็จสิ้น" | "รอติดตาม" | "";
  images?: ImageFile[];
}

export function DetailType6Issue({
  isVisible,
  target,
  problemDetail,
  initialSolution,
  status,
  images = [],
}: DetailType6IssueProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-rose-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Wrench className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-rose-900 text-base md:text-lg">
            แก้ปัญหา / รับเรื่องร้องเรียน
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-rose-600"
        badgeColorClass="bg-rose-50 text-rose-800 border border-rose-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ลูกค้า:", value: target.customer || "-" },
          { label: "ประเภทปัญหา:", value: target.issueType || "-" },
          { label: "รายละเอียดปัญหา:", value: target.detail || "-" },
          { label: "เป้าหมายการแก้ปัญหา:", value: target.targetStatus || "-" },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>ผลการแก้ไขปัญหาจริง</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 md:col-span-2">
            <span className="text-xs text-slate-500 font-medium block">
              รายละเอียดปัญหาที่พบ / ข้อร้องเรียน
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {problemDetail || target.detail || "-"}
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะการแก้ปัญหา
            </span>
            {status ? (
              <Badge
                variant="outline"
                className={
                  status === "เสร็จสิ้น"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1 mt-1"
                    : "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs px-3 py-1 mt-1"
                }
              >
                {status === "เสร็จสิ้น" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                )}
                {status}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              แนวทางแก้ไขปัญหาเบื้องต้น
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {initialSolution || "-"}
            </p>
          </div>
        </div>

        {/* ISSUE IMAGES (READ-ONLY) */}
        {images.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
              ภาพถ่ายปัญหา / การแก้ไข
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Issue Image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
