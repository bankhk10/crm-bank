"use client";

import React from "react";
import { Type14PlanCard } from "./type14-plan-card";
import type { Type14PlotItem } from "../../shared/types";
import type {
  Type14ApprovalProps,
  Type14ApprovalCardProps,
} from "../types/actual.types";

export type { Type14ApprovalProps, Type14ApprovalCardProps };

export function Type14ApprovalCard({
  isVisible = true,
  data,
  plots = [],
  planSummary,
  className = "",
}: Type14ApprovalProps) {
  if (!isVisible) return null;
  return (
    <Type14PlanCard
      data={data}
      plots={plots}
      planSummary={planSummary}
      className={className}
    />
  );
}

export { Type14ApprovalCard as Type14Approval };
