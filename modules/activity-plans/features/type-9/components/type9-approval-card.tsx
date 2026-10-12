"use client";

import React from "react";
import { Type9PlanCard } from "./type9-plan-card";
import type { ApprovalType9StoreProps, Type9ApprovalCardProps } from "../types";

export type { ApprovalType9StoreProps, Type9ApprovalCardProps };

export function Type9ApprovalCard({
  isVisible,
  target,
  targets,
}: Type9ApprovalCardProps) {
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

export const ApprovalType9Store = Type9ApprovalCard;
