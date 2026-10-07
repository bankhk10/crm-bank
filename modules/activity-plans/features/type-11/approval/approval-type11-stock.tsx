"use client";

import React from "react";
import { Type11PlanCard } from "../shared/type11-plan-card";
import type { ApprovalType11StockProps } from "../actual/types";

export type { ApprovalType11StockProps };

export function ApprovalType11Stock({
  isVisible,
  target,
}: ApprovalType11StockProps) {
  if (!isVisible) return null;

  return <Type11PlanCard target={target} />;
}

