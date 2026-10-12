"use client";

import React from "react";
import { Type10PlanCard } from "./type10-plan-card";
import type { ApprovalType10FieldDayProps, Type10ApprovalCardProps } from "../types";

export type { ApprovalType10FieldDayProps, Type10ApprovalCardProps };

export function Type10ApprovalCard({
  isVisible,
  target,
  targets,
}: Type10ApprovalCardProps) {
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

export const ApprovalType10FieldDay = Type10ApprovalCard;
