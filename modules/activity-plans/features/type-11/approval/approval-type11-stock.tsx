"use client";

import React from "react";
import { Type11PlanCard } from "../shared/type11-plan-card";
import type { ApprovalType11StockProps } from "../actual/types";

export type { ApprovalType11StockProps };

export function ApprovalType11Stock({
  isVisible,
  target,
  targets,
}: ApprovalType11StockProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type11PlanCard key={t.id || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type11PlanCard target={target} />;
}
