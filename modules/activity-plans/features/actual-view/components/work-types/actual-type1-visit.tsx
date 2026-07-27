"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";

interface ActualType1VisitProps {
  isVisible: boolean;
  target: {
    customer: string;
    topic: string;
    detail: string;
    opportunity: string;
    nextDate: string;
  };
  productAdvice: string;
  setProductAdvice: (v: string) => void;
  detail: string;
  setDetail: (v: string) => void;
  discussionResult: string;
  setDiscussionResult: (v: string) => void;
  salesOpportunity: "สูง" | "กลาง" | "ต่ำ" | "";
  setSalesOpportunity: (v: "สูง" | "กลาง" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
  nextMeetingDate: string;
  setNextMeetingDate: (v: string) => void;
}

export function ActualType1Visit({
  isVisible,
  target,
  productAdvice,
  setProductAdvice,
  detail,
  setDetail,
  discussionResult,
  setDiscussionResult,
  salesOpportunity,
  setSalesOpportunity,
  nextAction,
  setNextAction,
  nextMeetingDate,
  setNextMeetingDate,
}: ActualType1VisitProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-teal-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-sm shadow-2xs">
            1
          </span>
          <h2 className="font-bold text-teal-900 text-base md:text-lg">
            เข้าพบร้านค้า / เกษตรกร
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-teal-600"
        badgeColorClass="bg-teal-100 text-teal-800"
        gridColsClass="grid-cols-1 sm:grid-cols-2"
        items={[
          { label: "ลูกค้า/ร้านค้า:", value: target.customer },
          { label: "หัวข้อเป้าหมาย:", value: target.topic },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            สินค้าที่ให้คำแนะนำ (ถ้ามี)
          </label>
          <Input
            value={productAdvice}
            onChange={(e) => setProductAdvice(e.target.value)}
            placeholder="เช่น ปุ๋ยเคมีสูตร 15-15-15, สารบำรุงราก"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["สูง", "กลาง", "ต่ำ"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSalesOpportunity(opt)}
                className={cn(
                  "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  salesOpportunity === opt
                    ? opt === "สูง"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                      : opt === "กลาง"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-slate-100 border-slate-400 text-slate-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          รายละเอียด <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="ระบุรายละเอียดวัตถุประสงค์ในการเข้าพบ"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          ผลการพูดคุย <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={discussionResult}
          onChange={(e) => setDiscussionResult(e.target.value)}
          placeholder="สรุปประเด็นสำคัญจากการพูดคุยกับลูกค้า"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            สิ่งที่ต้องดำเนินการต่อ
          </label>
          <Textarea
            rows={2}
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="เช่น ส่งใบเสนอราคา, นำตัวอย่างสินค้ามาให้ลอง"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            วันที่นัดหมายครั้งถัดไป
          </label>
          <Input
            type="date"
            value={nextMeetingDate}
            onChange={(e) => setNextMeetingDate(e.target.value)}
            className="bg-white border-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
