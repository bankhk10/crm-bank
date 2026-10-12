"use client";

import React from "react";
import { Type10PlanCard } from "../shared/type10-plan-card";
import type { ApprovalType10FieldDayProps } from "../actual/types";

export type { ApprovalType10FieldDayProps };

export function ApprovalType10FieldDay({
  isVisible,
  target,
  targets,
}: ApprovalType10FieldDayProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type10PlanCard key={t.id || t.demoPlotId || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type10PlanCard target={target} />;
}

