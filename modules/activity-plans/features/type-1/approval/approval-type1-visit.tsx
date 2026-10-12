"use client";

import React from "react";
import { UserCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type1TargetItem } from "../types";
import { Type1PlanCard } from "../components/type1-plan-card";

interface ApprovalType1VisitProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
}

export function ApprovalType1Visit({
  isVisible,
  target,
  targets,
}: ApprovalType1VisitProps) {
  if (!isVisible) return null;

  const effectiveTargets =
    targets && targets.length > 0 ? targets : target ? [target] : [];
  const count = effectiveTargets.length;
  const storeCount = effectiveTargets.filter((t) => t.visitPurpose === "STORE").length;
  const farmerCount = count - storeCount;

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            {storeCount > farmerCount ? (
              <Store className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </div>
          <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
            เข้าพบร้านค้า / Key Farmer
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {count > 1 && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {count} เป้าหมาย
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
          >
            TYPE_1
          </Badge>
        </div>
      </div>

      {/* REUSED SHARED PLAN CARD */}
      <Type1PlanCard target={target} targets={targets} />
    </div>
  );
}

