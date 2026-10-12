"use client";

import React from "react";
import { Type7aPlanCard } from "../shared/type7a-plan-card";
import type { ApprovalType7aDemoProps } from "../actual/types";

export type { ApprovalType7aDemoProps };

export function ApprovalType7aDemo({
  isVisible,
  target,
  targets,
}: ApprovalType7aDemoProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type7aPlanCard key={t.id || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type7aPlanCard target={target} />;
}
