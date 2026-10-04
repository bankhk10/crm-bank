"use client";

import React from "react";
import { Type9PlanCard } from "../shared/type9-plan-card";
import type { ApprovalType9StoreProps } from "../actual/types";

export type { ApprovalType9StoreProps };

export function ApprovalType9Store({
  isVisible,
  target,
}: ApprovalType9StoreProps) {
  if (!isVisible) return null;

  return <Type9PlanCard target={target} />;
}

