"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";

interface ActualType2FollowupProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    detail: string;
    expectedResult: string;
  };
  customerName: string;
  setCustomerName: (v: string) => void;
  detail: string;
  setDetail: (v: string) => void;
  usageResult: "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | "";
  setUsageResult: (v: "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | "") => void;
  problemDetail: string;
  setProblemDetail: (v: string) => void;
}

export function ActualType2Followup({
  isVisible,
  target,
  customerName,
  setCustomerName,
  detail,
  setDetail,
  usageResult,
  setUsageResult,
  problemDetail,
  setProblemDetail,
}: ActualType2FollowupProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-cyan-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-cyan-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm shadow-2xs">
            2
          </span>
          <h2 className="font-bold text-cyan-900 text-base md:text-lg">
            ติดตามผลการใช้สินค้า
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-cyan-600"
        badgeColorClass="bg-cyan-100 text-cyan-800"
        items={[
          { label: "สินค้าที่ติดตาม:", value: target.product },
          { label: "ลูกค้า/ร้านค้า:", value: target.customer },
          { label: "คาดหวังผลลัพธ์:", value: target.expectedResult, highlight: true },
        ]}
      />

      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-semibold text-slate-800">
          รายชื่อลูกค้า / ร้านค้า <span className="text-rose-500">*</span>
        </label>
        <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="เช่น นายสมชาย (สวนทุเรียน อ.แกลง)"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          รายละเอียดการติดตาม <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="ระบุรายละเอียดสินค้าและแปลงที่นำไปใช้งาน"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          ผลลัพธ์จากการใช้งาน <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["พืชตอบสนองดี", "ยังไม่เห็นผลชัดเจน", "พบปัญหา"] as const).map(
            (resOpt) => (
              <button
                key={resOpt}
                type="button"
                onClick={() => setUsageResult(resOpt)}
                className={cn(
                  "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                  usageResult === resOpt
                    ? resOpt === "พืชตอบสนองดี"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                      : resOpt === "ยังไม่เห็นผลชัดเจน"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>
                  {resOpt === "พืชตอบสนองดี"
                    ? "🟢"
                    : resOpt === "ยังไม่เห็นผลชัดเจน"
                      ? "🕒"
                      : "⚠️"}
                </span>
                <span>{resOpt}</span>
              </button>
            )
          )}
        </div>
      </div>

      {usageResult === "พบปัญหา" && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-rose-800">
            ระบุรายละเอียดปัญหาที่พบ <span className="text-rose-500">*</span>
          </label>
          <Textarea
            rows={2}
            value={problemDetail}
            onChange={(e) => setProblemDetail(e.target.value)}
            placeholder="เช่น ใบเหลือง, เกิดคราบไหม้, อัตราส่วนเข้มข้นเกินไป"
            className="bg-white border-rose-200"
          />
        </div>
      )}
    </div>
  );
}
