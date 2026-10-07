"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import { Type2PlanCard } from "../shared/type2-plan-card";

interface ApprovalType2FollowupProps {
  isVisible: boolean;
  target: ActualTargetsState["t2"];
}

export function ApprovalType2Followup({
  isVisible,
  target,
}: ApprovalType2FollowupProps) {
  if (!isVisible) return null;

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
      </div>

      <Type2PlanCard target={target} />
    </div>
  );
}
