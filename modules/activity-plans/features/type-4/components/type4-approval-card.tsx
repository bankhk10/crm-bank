"use client";

import React, { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import { Type4PlanCard } from "./type4-plan-card";
import type {
  TargetCollectCompanyItem,
  ApprovalType4CollectProps,
  Type4ApprovalCardProps,
} from "../types";

export type { ApprovalType4CollectProps, Type4ApprovalCardProps };

export function Type4ApprovalCard({
  isVisible,
  target,
  targets,
}: Type4ApprovalCardProps) {
  if (!isVisible) return null;

  const resolvedTarget: ActualTargetsState["t4"] | undefined = useMemo(() => {
    if (target && target.items && target.items.length > 0) return target;
    if (targets && targets.length > 0) {
      const allItems: TargetCollectCompanyItem[] = targets.flatMap((t, idx) =>
        t.items && t.items.length > 0
          ? (t.items as TargetCollectCompanyItem[])
          : [
              {
                id: t.id || `t4-item-${idx}`,
                customer: t.customer,
                companyName: t.companyName || t.customer,
                storeId: t.storeId,
                collectType: t.collectType || "COLLECT",
                targetCollect: t.targetCollect || "",
                targetAmountNum: t.targetAmountNum ?? t.collectAmount,
                detail: t.detail || t.notes,
              },
            ],
      );
      const totalAmount = targets.reduce(
        (sum, t) => sum + (t.targetAmountNum || t.collectAmount || 0),
        0,
      );
      return {
        ...targets[0],
        customer: targets.map((t) => t.customer).filter(Boolean).join(", "),
        targetCollect:
          totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : targets[0].targetCollect,
        targetAmountNum: totalAmount,
        collectAmount: totalAmount,
        items: allItems,
      };
    }
    return target;
  }, [target, targets]);

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

      <Type4PlanCard target={resolvedTarget} />
    </div>
  );
}

// Backward-compatible alias
export const ApprovalType4Collect = Type4ApprovalCard;
