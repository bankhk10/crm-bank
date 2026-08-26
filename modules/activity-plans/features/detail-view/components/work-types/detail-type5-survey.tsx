"use client";

import React from "react";
import { BarChart2, ImageIcon } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";

export interface TargetSurveyItem {
  store: string;
  product: string;
  detail: string;
}

interface DetailType5SurveyProps {
  isVisible: boolean;
  target: {
    store: string;
    product: string;
    detail: string;
    items?: TargetSurveyItem[];
  };
  competitorBrand?: string;
  competitorProduct?: string;
  competitorPrice?: string;
  competitorUnit?: string;
  promotionDetail?: string;
  priceTagImages?: ImageFile[];
}

export function DetailType5Survey({
  isVisible,
  target,
  competitorBrand,
  competitorProduct,
  competitorPrice,
  competitorUnit,
  promotionDetail,
  priceTagImages = [],
}: DetailType5SurveyProps) {
  if (!isVisible) return null;

  const hasMultipleItems = target.items && target.items.length > 1;

  return (
    <div className="border border-amber-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <BarChart2 className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-amber-900 text-base md:text-lg">
            สำรวจตลาดของคู่แข่ง
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      {hasMultipleItems ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <span className="text-xs font-bold text-slate-800">
            เป้าหมายการสำรวจตลาด ({target.items!.length} รายการ):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {target.items!.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs space-y-0.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="text-amber-800">
                    {idx + 1}. {item.store}
                  </span>
                  <span className="text-slate-500 font-normal">
                    {item.product}
                  </span>
                </div>
                {item.detail && (
                  <p className="text-[11px] text-slate-400">{item.detail}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-amber-600"
          badgeColorClass="bg-amber-50 text-amber-800 border border-amber-200"
          gridColsClass="grid-cols-1 sm:grid-cols-3"
          items={[
            { label: "ร้านค้าเป้าหมาย:", value: target.store || "-" },
            { label: "สินค้าเป้าหมาย:", value: target.product || "-" },
            { label: "รายละเอียด:", value: target.detail || "-" },
          ]}
        />
      )}

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>ผลการสำรวจคู่แข่งจริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              แบรนด์คู่แข่ง
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {competitorBrand || "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ชื่อสินค้าคู่แข่ง
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {competitorProduct || "-"}
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-amber-700 font-medium block">
              ราคาขายของคู่แข่ง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-amber-900 block">
              {competitorPrice
                ? `฿${Number(competitorPrice).toLocaleString()} / ${competitorUnit || "หน่วย"}`
                : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              รายละเอียดโปรโมชั่นของคู่แข่ง
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {promotionDetail || "-"}
            </p>
          </div>
        </div>

        {/* PRICE TAG IMAGES (READ-ONLY) */}
        {priceTagImages.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              รูปถ่ายป้ายราคา / สินค้าคู่แข่ง
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {priceTagImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Price Tag Image"}
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
