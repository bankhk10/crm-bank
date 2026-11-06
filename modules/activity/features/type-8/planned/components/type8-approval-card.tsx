"use client";

import React from "react";
import type { Type8ApprovalCardProps } from "../types/actual.types";
import { Type8PlanCard } from "./type8-plan-card";
import { extractType8PlanTargets } from "../application/planned-mapper";

export function Type8ApprovalCard({
  isVisible = true,
  target,
  targets,
  plan,
}: Type8ApprovalCardProps) {
  if (!isVisible) return null;

  let meetingList: any[] = [];
  if (targets && targets.length > 0) {
    meetingList = targets;
  } else if (target) {
    meetingList = [target];
  } else if (plan) {
    meetingList = extractType8PlanTargets(plan).list;
  }

  if (meetingList.length === 0) return null;

  return (
    <div className="space-y-4">
      {meetingList.map((t, idx) => (
        <Type8PlanCard key={t.id || idx} target={t} />
      ))}
    </div>
  );
}

// Backward-compatible alias
export const ApprovalType8Meeting = Type8ApprovalCard;
