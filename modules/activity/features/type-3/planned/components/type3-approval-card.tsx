"use client";

import React from "react";
import { ShoppingCart, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Type3PlanCard } from "./type3-plan-card";
import type { Type3ApprovalCardProps } from "../types/actual.types";

export type { Type3ApprovalCardProps };

export function Type3ApprovalCard({
  isVisible,
  target,
  targets,
}: Type3ApprovalCardProps) {
  if (!isVisible) return null;

  const effectiveTargets =
    targets && targets.length > 0 ? targets : target ? [target] : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
              เสนอขายสินค้า (Product Sales Proposal)
            </h4>
            <p className="text-xs text-slate-500">
              รายละเอียดร้านค้าเป้าหมายและรายการสินค้าที่ขอเสนอขาย
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {effectiveTargets.length > 1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Layers className="w-3.5 h-3.5" />
              ทั้งหมด {effectiveTargets.length} ร้านค้า
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
          >
            TYPE_3
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {effectiveTargets.map((t, idx) => (
          <Type3PlanCard
            key={t.id || `type3-appr-card-${idx}`}
            target={t}
          />
        ))}
      </div>
    </div>
  );
}

export const ApprovalType3Sales = Type3ApprovalCard;
