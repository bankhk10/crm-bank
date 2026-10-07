"use client";

import React from "react";
import { UserCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import { Type1PlanCard } from "../shared/type1-plan-card";

interface ApprovalType1VisitProps {
  isVisible: boolean;
  target: ActualTargetsState["t1"];
}

export function ApprovalType1Visit({
  isVisible,
  target,
}: ApprovalType1VisitProps) {
  if (!isVisible) return null;

  const isStore = target?.visitPurpose === "STORE";

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            {isStore ? <Store className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
            เข้าพบร้านค้า / Key Farmer
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
        >
          TYPE_1
        </Badge>
      </div>

      {/* REUSED SHARED PLAN CARD */}
      <Type1PlanCard target={target} />
    </div>
  );
}

