"use client";

import React from "react";
import { Type7bPlanCard } from "../shared/type7b-plan-card";
import type { ApprovalType7bDemoProps } from "../actual/types";

export type { ApprovalType7bDemoProps };

export function ApprovalType7bDemo({
  isVisible,
  target,
}: ApprovalType7bDemoProps) {
  if (!isVisible) return null;

  return <Type7bPlanCard target={target} />;
}

