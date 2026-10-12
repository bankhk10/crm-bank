"use client";

import React from "react";
import { Type8PlanCard } from "../shared/type8-plan-card";
import type { ApprovalType8MeetingProps } from "../actual/types";

export type { ApprovalType8MeetingProps };

export function ApprovalType8Meeting({
  isVisible,
  target,
  targets,
}: ApprovalType8MeetingProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-4">
        {targets.map((t, idx) => (
          <Type8PlanCard key={t.id || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type8PlanCard target={target} />;
}
