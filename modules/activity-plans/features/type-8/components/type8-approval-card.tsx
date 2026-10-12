"use client";

import React from "react";
import { Type8PlanCard } from "./type8-plan-card";
import type { ApprovalType8MeetingProps, Type8ApprovalCardProps } from "../types";

export type { ApprovalType8MeetingProps, Type8ApprovalCardProps };

export function Type8ApprovalCard({
  isVisible,
  target,
  targets,
}: Type8ApprovalCardProps) {
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

export const ApprovalType8Meeting = Type8ApprovalCard;
