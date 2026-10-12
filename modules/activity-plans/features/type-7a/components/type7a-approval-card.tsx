"use client";

import React from "react";
import { Type7aPlanCard } from "./type7a-plan-card";
import type {
  ApprovalType7aDemoProps,
  Type7aApprovalCardProps,
} from "../types";

export type { ApprovalType7aDemoProps, Type7aApprovalCardProps };

export function Type7aApprovalCard({
  isVisible,
  target,
  targets,
}: Type7aApprovalCardProps) {
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

// Backward-compatible alias
export const ApprovalType7aDemo = Type7aApprovalCard;
