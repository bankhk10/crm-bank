"use client";

import React from "react";
import { Type9PlanCard } from "../shared/type9-plan-card";
import type { ApprovalType9StoreProps } from "../actual/types";

export type { ApprovalType9StoreProps };

export function ApprovalType9Store({
  isVisible,
  target,
  targets,
}: ApprovalType9StoreProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type9PlanCard key={t.id || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type9PlanCard target={target} />;
}

