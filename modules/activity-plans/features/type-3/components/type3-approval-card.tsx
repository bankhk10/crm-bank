"use client";

import React from "react";
import { Tag, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  Type3TargetItem,
  Type3ApprovalCardProps,
  ApprovalType3SalesProps,
} from "../types";
import { Type3PlanCard } from "./type3-plan-card";

export type { Type3ApprovalCardProps, ApprovalType3SalesProps };

export function Type3ApprovalCard({
  isVisible,
  target,
  targets,
}: Type3ApprovalCardProps) {
  if (!isVisible) return null;

  const effectiveTargets =
    targets && targets.length > 0 ? targets : target ? [target] : [];

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <Tag className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-blue-900 text-sm sm:text-base">
            เสนอขายสินค้า
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {effectiveTargets.length > 1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Layers className="w-3.5 h-3.5" />
              ทั้งหมด {effectiveTargets.length} ร้านค้า
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[11px] font-bold bg-blue-50 text-blue-800 border-blue-200"
          >
            TYPE_3
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {effectiveTargets.map((t, idx) => (
          <Type3PlanCard
            key={t.id || `t3-appr-card-${idx}`}
            target={t}
          />
        ))}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ApprovalType3Sales = Type3ApprovalCard;
