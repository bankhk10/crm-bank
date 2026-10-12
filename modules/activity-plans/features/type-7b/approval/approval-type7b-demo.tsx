"use client";

import React from "react";
import { Type7bPlanCard } from "../shared/type7b-plan-card";
import type { ApprovalType7bDemoProps } from "../actual/types";

export type { ApprovalType7bDemoProps };

export function ApprovalType7bDemo({
  isVisible,
  target,
  targets,
}: ApprovalType7bDemoProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type7bPlanCard key={t.id || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type7bPlanCard target={target} />;
}
