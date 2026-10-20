"use client";

import React from "react";
import { Sprout, MapPin, User, Package } from "lucide-react";
import type { Type7aApprovalCardProps } from "../types/actual.types";
import { extractType7aPlanTargets } from "../application/planned-mapper";

export function Type7aApprovalCard({
  isVisible = true,
  plan,
  target,
  targets,
}: Type7aApprovalCardProps) {
  if (!isVisible) return null;

  let plotList: any[] = [];
  if (targets && targets.length > 0) {
    plotList = targets;
  } else if (target) {
    plotList = [target];
  } else if (plan) {
    plotList = extractType7aPlanTargets(plan).list;
  }

  if (!plotList || plotList.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Sprout className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-800">
            ขออนุมัติจัดทำแปลงสาธิต (Type 7A)
          </h4>
          <span className="text-[11px] text-slate-500">
            จำนวน {plotList.length} แปลง
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-xs">
        {plotList.map((t, idx) => (
          <div
            key={t.id || idx}
            className="bg-emerald-50/40 rounded-lg p-2.5 border border-emerald-100/60 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950">
                {idx + 1}. {t.plotName || "แปลงสาธิต"}
              </span>
              {t.areaRai != null && (
                <span className="text-[11px] text-emerald-700 font-medium">
                  {String(t.areaRai)} ไร่
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px]">
              เกษตรกร: <span className="font-medium text-slate-800">{t.ownerName || t.farmerName || "-"}</span> | พืช: <span className="font-medium text-slate-800">{t.cropName || t.cropCategory || "-"}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ApprovalType7aDemo = Type7aApprovalCard;
