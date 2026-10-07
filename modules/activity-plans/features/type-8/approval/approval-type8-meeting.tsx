"use client";

import React from "react";
import { Type8PlanCard } from "../shared/type8-plan-card";
import type { ApprovalType8MeetingProps } from "../actual/types";

export type { ApprovalType8MeetingProps };

export function ApprovalType8Meeting({
  isVisible,
  target,
}: ApprovalType8MeetingProps) {
  if (!isVisible) return null;

  return <Type8PlanCard target={target} />;
}

