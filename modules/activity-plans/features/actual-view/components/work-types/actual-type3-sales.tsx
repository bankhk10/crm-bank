"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";

interface ActualType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    targetQty: string;
    targetSales: string;
  };
  soldProducts: string;
  setSoldProducts: (v: string) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualQuantity: string;
  setActualQuantity: (v: string) => void;
  unclosedReason: string;
  setUnclosedReason: (v: string) => void;
}

export function ActualType3Sales({
  isVisible,
  target,
  soldProducts,
  setSoldProducts,
  actualSales,
  setActualSales,
  actualQuantity,
  setActualQuantity,
  unclosedReason,
  setUnclosedReason,
}: ActualType3SalesProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-emerald-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-2xs">
            3
          </span>
          <h2 className="font-bold text-emerald-900 text-base md:text-lg">
            เสนอขายสินค้า
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-emerald-600"
        badgeColorClass="bg-emerald-100 text-emerald-800"
        items={[
          { label: "สินค้าเสนอขาย:", value: target.product },
          { label: "เป้าหมายปริมาณ:", value: target.targetQty },
          { label: "เป้ายอดขาย:", value: target.targetSales, highlight: true },
        ]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ปริมาณขายจริง <span className="text-rose-500">*</span>
          </label>
          <Input
            value={actualQuantity}
            onChange={(e) => setActualQuantity(e.target.value)}
            placeholder="จำนวน"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ยอดขายจริง (บาท) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          เหตุผล (กรณีไม่สามารถปิดการขายได้)
        </label>
        <Textarea
          rows={2}
          value={unclosedReason}
          onChange={(e) => setUnclosedReason(e.target.value)}
          placeholder="ระบุเหตุผล เช่น ติดปัญหาเครดิตเทอม หรือคู่แข่งเสนอส่วนลดสูงกว่า"
          className="bg-white border-slate-300"
        />
      </div>
    </div>
  );
}
