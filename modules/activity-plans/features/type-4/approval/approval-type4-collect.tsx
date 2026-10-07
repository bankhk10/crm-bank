"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import { Type4PlanCard } from "../shared/type4-plan-card";

export interface ApprovalType4CollectProps {
  isVisible: boolean;
  target: ActualTargetsState["t4"];
  actualCollectAmount?: number | string | null;
}

export function ApprovalType4Collect({
  isVisible,
  target,
}: ApprovalType4CollectProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-amber-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <DollarSign className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-amber-900 text-sm sm:text-base">
            วางบิล / เก็บเงิน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-amber-50 text-amber-800 border-amber-200"
        >
          TYPE_4
        </Badge>
      </div>

      <Type4PlanCard target={target} />
    </div>
  );
}

