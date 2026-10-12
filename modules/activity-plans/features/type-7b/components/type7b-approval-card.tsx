"use client";

import React from "react";
import { Type7bPlanCard } from "./type7b-plan-card";
import type { ApprovalType7bDemoProps, Type7bApprovalCardProps } from "../types";

export type { ApprovalType7bDemoProps, Type7bApprovalCardProps };

export function Type7bApprovalCard({
  isVisible,
  target,
  targets,
}: Type7bApprovalCardProps) {
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

export const ApprovalType7bDemo = Type7bApprovalCard;
