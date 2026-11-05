"use client";

import React from "react";
import { Megaphone, Store, Home, Target, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Type15PlanCardProps } from "../types/actual.types";

export function Type15PlanCard({
  target,
  targets,
  className,
}: Type15PlanCardProps) {
  const items = targets && targets.length > 0 ? targets : target ? [target] : [];

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "p-4 bg-orange-50/40 rounded-xl border border-orange-200/80 space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-orange-950 border-b border-orange-200/60 pb-2">
        <Megaphone className="h-4 w-4 text-orange-600" />
        <span>ข้อมูลเป้าหมายจากแผนงาน (Plan Target Summary)</span>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const storeName =
            item.store?.name ||
            item.storeName ||
            item.customerName ||
            item.dealerName ||
            "-";
          const isSubDealer = Boolean(item.isSubDealer);
          const subdealerLabel = item.isUnregisteredSubdealer
            ? `${item.subDealerStore || "-"} (ระบุเอง)`
            : item.subdealer?.name || item.subdealerName || item.subDealerStore || "-";

          return (
            <div
              key={item.id || idx}
              className="bg-white/80 p-3 rounded-lg border border-orange-100 text-xs space-y-2 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {!isSubDealer ? (
                    <span className="flex items-center gap-1 text-slate-700">
                      <Store className="h-3.5 w-3.5 text-orange-600" />
                      ร้านค้า (Dealer): <strong className="text-slate-900">{storeName}</strong>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-700">
                      <Store className="h-3.5 w-3.5 text-amber-600" />
                      ร้านค้า (Subdealer): <strong className="text-slate-900">{subdealerLabel}</strong>
                      <span className="text-slate-400 font-normal">
                        (สังกัด Dealer: {storeName})
                      </span>
                    </span>
                  )}
                </span>
                {isSubDealer && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    Subdealer
                  </span>
                )}
              </div>

              {item.village && (
                <div className="flex items-center gap-1.5 text-slate-600 pl-5">
                  <Home className="h-3.5 w-3.5 text-slate-400" />
                  <span>หมู่บ้าน:</span>
                  <span className="text-slate-800 font-medium">{item.village}</span>
                </div>
              )}

              {item.objective && (
                <div className="flex items-start gap-1.5 text-slate-600 pl-5">
                  <Target className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                  <span>วัตถุประสงค์:</span>
                  <span className="text-slate-800 font-medium">{item.objective}</span>
                </div>
              )}

              {item.detail && (
                <div className="flex items-start gap-1.5 text-slate-600 pl-5">
                  <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                  <span>รายละเอียดเพิ่มเติม:</span>
                  <span className="text-slate-800">{item.detail}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

