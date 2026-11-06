"use client";

import React from "react";
import { Megaphone, Store, Home, Target, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Type15ApprovalCardProps } from "../types/actual.types";

export function Type15ApprovalCard({
  target,
  targets,
  className,
}: Type15ApprovalCardProps) {
  const items = targets && targets.length > 0 ? targets : target ? [target] : [];

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2.5">
        <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center">
          <Megaphone className="h-3.5 w-3.5" />
        </div>
        <span>เป้าหมายแผนงาน บูมทีม / คาราวาน ({items.length} รายการ)</span>
      </div>

      <div className="divide-y divide-slate-100">
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
            <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {!isSubDealer ? (
                    <span>Dealer: {storeName}</span>
                  ) : (
                    <span>
                      Subdealer: {subdealerLabel}{" "}
                      <span className="text-slate-400 font-normal">
                        (สังกัด {storeName})
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
                <div className="text-slate-600 pl-5 flex items-center gap-1.5">
                  <Home className="h-3 w-3 text-slate-400" />
                  <span>หมู่บ้าน:</span>
                  <span className="text-slate-800 font-medium">{item.village}</span>
                </div>
              )}

              {item.objective && (
                <div className="text-slate-600 pl-5 flex items-start gap-1.5">
                  <Target className="h-3 w-3 text-slate-400 mt-0.5" />
                  <span>วัตถุประสงค์:</span>
                  <span className="text-slate-800">{item.objective}</span>
                </div>
              )}

              {item.detail && (
                <div className="text-slate-600 pl-5 flex items-start gap-1.5">
                  <FileText className="h-3 w-3 text-slate-400 mt-0.5" />
                  <span>รายละเอียด:</span>
                  <span className="text-slate-700">{item.detail}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

