"use client";

import React from "react";
import { CheckCircle2, Layers } from "lucide-react";
import type {
  Type2TargetItem,
  Type2ApprovalCardProps,
  ApprovalType2FollowupProps,
} from "../types/planned.types";
import { Type2PlanCard } from "./type2-plan-card";

export type { Type2ApprovalCardProps, ApprovalType2FollowupProps };

export function Type2ApprovalCard({
  isVisible,
  target,
  targets,
}: Type2ApprovalCardProps) {
  if (!isVisible) return null;

  const effectiveTargets: Type2TargetItem[] =
    targets && targets.length > 0 ? targets : target ? [target] : [];

  return (
    <div className="border border-teal-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-teal-900 text-sm sm:text-base">
            ติดตามผลการใช้สินค้า
          </h4>
        </div>
        {effectiveTargets.length > 1 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Layers className="w-3.5 h-3.5" />
            ทั้งหมด {effectiveTargets.length} เป้าหมาย
          </span>
        )}
      </div>

      <div className="space-y-3">
        {effectiveTargets.map((t, idx) => (
          <Type2PlanCard
            key={t.id || `t2-appr-target-${idx}`}
            target={t}
          />
        ))}
      </div>
    </div>
  );
}

export const ApprovalType2Followup = Type2ApprovalCard;
