"use client";

import React from "react";
import { Type10PlanCard } from "../shared/type10-plan-card";
import type { ApprovalType10FieldDayProps } from "../actual/types";

export type { ApprovalType10FieldDayProps };

export function ApprovalType10FieldDay({
  isVisible,
  target,
}: ApprovalType10FieldDayProps) {
  if (!isVisible) return null;

  return <Type10PlanCard target={target} />;
}

