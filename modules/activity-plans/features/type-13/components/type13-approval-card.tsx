"use client";

import React from "react";
import { Type13PlanCard } from "./type13-plan-card";
import type { Type13ApprovalProps, Type13ApprovalCardProps } from "../types";

export type { Type13ApprovalProps, Type13ApprovalCardProps };

export function Type13ApprovalCard({
  isVisible = true,
  plots = [],
  planSummary,
}: Type13ApprovalProps) {
  if (!isVisible) return null;
  return <Type13PlanCard plots={plots} planSummary={planSummary} />;
}

export { Type13ApprovalCard as Type13Approval };
export default Type13ApprovalCard;
