"use client";

import React from "react";
import { Search, MapPin, User, Package } from "lucide-react";
import type { Type7bApprovalCardProps } from "../types/actual.types";
import { extractType7bPlanTargets } from "../application/planned-mapper";

export function Type7bApprovalCard({
  isVisible = true,
  plan,
  target,
  targets,
}: Type7bApprovalCardProps) {
  if (!isVisible) return null;

  let plotList: any[] = [];
  if (targets && targets.length > 0) {
    plotList = targets;
  } else if (target) {
    plotList = [target];
  } else if (plan) {
    plotList = extractType7bPlanTargets(plan).list;
  }

  if (!plotList || plotList.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-blue-200/80 p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 border-b border-blue-100 pb-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
          <Search className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-800">
            ขออนุมัติติดตามแปลงสาธิต (Type 7B)
          </h4>
          <span className="text-[11px] text-slate-500">
            จำนวน {plotList.length} แปลง
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-xs">
        {plotList.map((t, idx) => {
          const prods = t.demoProducts || t.withdrawnProducts || [];

          return (
            <div
              key={t.id || idx}
              className="bg-blue-50/40 rounded-lg p-2.5 border border-blue-100/60 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950">
                  {idx + 1}. {t.plotName || "แปลงสาธิตติดตาม"}
                </span>
                {t.areaRai != null && (
                  <span className="text-[11px] text-blue-700 font-medium">
                    {String(t.areaRai)} ไร่
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[11px]">
                เจ้าของแปลง:{" "}
                <span className="font-medium text-slate-800">
                  {t.ownerName || t.farmerName || t.owner || "-"}
                </span>{" "}
                | พืช:{" "}
                <span className="font-medium text-slate-800">
                  {t.cropName || t.crop || "-"}
                </span>
              </p>

              {prods.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {prods.map((p: any, pIdx: number) => (
                    <span
                      key={p.id || pIdx}
                      className="inline-block bg-white text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]"
                    >
                      {p.productName || p.product?.name}: {p.quantity || p.targetQuantity || 1} {p.unit || p.product?.unit || ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ApprovalType7bDemo = Type7bApprovalCard;
