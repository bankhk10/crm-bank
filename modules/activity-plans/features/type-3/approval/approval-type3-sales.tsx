"use client";

import React from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import { Type3PlanCard } from "../shared/type3-plan-card";

export interface ApprovalType3SalesProps {
  isVisible: boolean;
  target: ActualTargetsState["t3"];
}

export function ApprovalType3Sales({
  isVisible,
  target,
}: ApprovalType3SalesProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <Tag className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-blue-900 text-sm sm:text-base">
            เสนอขายสินค้า
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-blue-50 text-blue-800 border-blue-200"
        >
          TYPE_3
        </Badge>
      </div>

      <Type3PlanCard target={target} />
    </div>
  );
}

