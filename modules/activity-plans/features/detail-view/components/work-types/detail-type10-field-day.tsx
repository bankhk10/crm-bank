"use client";

import React from "react";
import { Flag, Users, ShoppingBag, ImageIcon, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";

interface DetailType10FieldDayProps {
  isVisible: boolean;
  target: {
    plot: string;
    location: string;
    showcase: string;
    targetAttendees: string;
    targetSales: string;
  };
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  targetFarmersList?: string;
  farmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
  images?: ImageFile[];
}

export function DetailType10FieldDay({
  isVisible,
  target,
  actualAttendees,
  actualSalesOrBooking,
  targetFarmersList,
  farmerFeedback,
  images = [],
}: DetailType10FieldDayProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-orange-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <Flag className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-orange-900 text-base md:text-lg">
            จัดงาน Field Day
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-orange-600"
        badgeColorClass="bg-orange-50 text-orange-800 border border-orange-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        items={[
          { label: "แปลงสาธิต:", value: target.plot || "-" },
          { label: "สถานที่จัดงาน:", value: target.location || "-" },
          { label: "จุดเด่นแปลง:", value: target.showcase || "-" },
          {
            label: "เป้าหมายผู้เข้าร่วม:",
            value: target.targetAttendees ? `${target.targetAttendees} คน` : "-",
            highlight: true,
          },
          {
            label: "เป้ายอดขาย/จอง:",
            value: target.targetSales ? `฿${target.targetSales}` : "-",
            highlight: true,
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>ผลการจัดงาน Field Day จริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              จำนวนผู้เข้าร่วมจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
              {actualAttendees ? `${actualAttendees} คน` : "-"}
            </span>
          </div>

          <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-orange-700 font-medium block flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-orange-600" />
              ยอดขาย / ยอดจองในงานจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-orange-950 block">
              {actualSalesOrBooking
                ? `฿${Number(actualSalesOrBooking.replace(/,/g, "")).toLocaleString()} บาท`
                : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              ผลตอบรับของเกษตรกร
            </span>
            {farmerFeedback ? (
              <Badge
                variant="outline"
                className={
                  farmerFeedback === "สูง"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                    : farmerFeedback === "กลาง"
                      ? "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                      : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs"
                }
              >
                {farmerFeedback}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          {targetFarmersList && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium block">
                รายชื่อกลุ่มเกษตรกรเป้าหมายที่เข้าร่วม
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {targetFarmersList}
              </p>
            </div>
          )}
        </div>

        {/* FIELD DAY IMAGES (READ-ONLY) */}
        {images.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
              ภาพถ่ายบรรยากาศงาน Field Day
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Field Day Image"}
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
