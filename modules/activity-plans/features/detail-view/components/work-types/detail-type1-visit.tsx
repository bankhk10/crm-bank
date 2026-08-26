"use client";

import React from "react";
import { Store, Calendar, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";

interface DetailType1VisitProps {
  isVisible: boolean;
  target: {
    customer: string;
    topic: string;
    detail: string;
    opportunity: string;
    nextDate: string;
  };
  productAdvice?: string;
  discussionResult?: string;
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  nextAction?: string;
  nextMeetingDate?: string;
}

export function DetailType1Visit({
  isVisible,
  target,
  productAdvice,
  discussionResult,
  salesOpportunity,
  nextAction,
  nextMeetingDate,
}: DetailType1VisitProps) {
  if (!isVisible) return null;

  const isAdviceTopic =
    target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" || !!productAdvice || !!salesOpportunity;

  const selectedProducts = productAdvice
    ? productAdvice
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center gap-2 pb-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Store className="w-4 h-4" />
        </div>
        <h2 className="font-bold text-emerald-800 text-base md:text-lg">
          เข้าพบร้านค้า / Key Farmer
        </h2>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-emerald-600"
        badgeColorClass="bg-emerald-50 text-emerald-700 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "ลูกค้าร้านค้าเป้า:", value: target.customer || "-" },
          { label: "ประเด็นหลัก:", value: target.topic || "-" },
          { label: "รายละเอียดเพิ่มเติม:", value: target.detail || "-" },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ผลการปฏิบัติงานจริง</span>
        </div>

        {isAdviceTopic && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* สินค้าที่ให้คำแนะนำ */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ให้คำแนะนำ
              </span>
              {selectedProducts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedProducts.map((prod, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      <Tag className="w-3 h-3 text-emerald-600" />
                      {prod}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-700 font-semibold">-</span>
              )}
            </div>

            {/* ประเมินโอกาสการขาย */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">
                ประเมินโอกาสการขาย
              </span>
              {salesOpportunity ? (
                <Badge
                  variant="outline"
                  className={
                    salesOpportunity === "สูง"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1"
                      : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs px-3 py-1"
                  }
                >
                  {salesOpportunity}
                </Badge>
              ) : (
                <span className="text-xs text-slate-700 font-semibold">-</span>
              )}
            </div>
          </div>
        )}

        {/* ผลการพูดคุย */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
          <span className="text-xs text-slate-500 font-medium block">
            ผลการพูดคุย
          </span>
          <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
            {discussionResult || "-"}
          </p>
        </div>

        {/* สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-slate-400" />
              สิ่งที่ต้องดำเนินการต่อ
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {nextAction || "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              วันที่นัดหมายครั้งถัดไป
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {formatThaiDate(nextMeetingDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
