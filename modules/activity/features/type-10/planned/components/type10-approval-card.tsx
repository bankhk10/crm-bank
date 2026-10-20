"use client";

import React from "react";
import { Type10PlanCard } from "./type10-plan-card";
import type { Type10ApprovalCardProps } from "../types/actual.types";

export type { Type10ApprovalCardProps };

export function Type10ApprovalCard({
  isVisible = true,
  target,
  targets,
}: Type10ApprovalCardProps) {
  if (!isVisible) return null;

  if (targets && targets.length > 0) {
    return (
      <div className="space-y-3">
        {targets.map((t, idx) => (
          <Type10PlanCard key={t.id || idx} target={t} />
        ))}
      </div>
    );
  }

  return <Type10PlanCard target={target} />;
}

export const ApprovalType10FieldDay = Type10ApprovalCard;
