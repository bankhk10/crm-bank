"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";

interface ActualType11StockProps {
  isVisible: boolean;
  target: {
    store: string;
    detail: string;
    targetOpportunity: string;
  };
  productList: string;
  setProductList: (v: string) => void;
  stockStatus: "ใกล้หมด" | "ขาดสต็อก" | "";
  setStockStatus: (v: "ใกล้หมด" | "ขาดสต็อก" | "") => void;
  reorderOpportunity: "สูง" | "กลาง" | "ต่ำ" | "";
  setReorderOpportunity: (v: "สูง" | "กลาง" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
}

export function ActualType11Stock({
  isVisible,
  target,
  productList,
  setProductList,
  stockStatus,
  setStockStatus,
  reorderOpportunity,
  setReorderOpportunity,
  nextAction,
  setNextAction,
}: ActualType11StockProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-slate-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-sm shadow-2xs">
            11
          </span>
          <h2 className="font-bold text-slate-900 text-base md:text-lg">
            ตรวจเช็กสต็อกหน้าร้าน
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-slate-600"
        badgeColorClass="bg-slate-200 text-slate-800"
        gridColsClass="grid-cols-1 sm:grid-cols-2"
        items={[
          { label: "ร้านค้าตรวจเช็ก:", value: target.store },
          { label: "โอกาสสั่งซื้อเป้าหมาย:", value: target.targetOpportunity, highlight: true },
        ]}
      />

      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-semibold text-slate-800">
          รายการสินค้าที่ตรวจเช็ก <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={productList}
          onChange={(e) => setProductList(e.target.value)}
          placeholder="เช่น ปุ๋ยสูตร 15-15-15, สารกำจัดแมลง X"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            สถานะสต็อกสินค้า <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["ใกล้หมด", "ขาดสต็อก"] as const).map((stk) => (
              <button
                key={stk}
                type="button"
                onClick={() => setStockStatus(stk)}
                className={cn(
                  "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  stockStatus === stk
                    ? stk === "ใกล้หมด"
                      ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {stk === "ใกล้หมด" ? "⚠️ ใกล้หมด" : "🚨 ขาดสต็อก"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            โอกาสการสั่งซื้อรอบใหม่ <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["สูง", "กลาง", "ต่ำ"] as const).map((opp) => (
              <button
                key={opp}
                type="button"
                onClick={() => setReorderOpportunity(opp)}
                className={cn(
                  "py-2.5 px-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  reorderOpportunity === opp
                    ? opp === "สูง"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                      : opp === "กลาง"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-slate-100 border-slate-400 text-slate-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {opp}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          สิ่งที่ต้องดำเนินการต่อ <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="เช่น ออกใบเสนอราคาสินค้าเพิ่มสต็อก หรือประสานงานฝ่ายจัดส่ง"
          className="bg-white border-slate-300"
        />
      </div>
    </div>
  );
}
