"use client";

import React from "react";
import { Type12PlanCard } from "./type12-plan-card";
import type { ApprovalType12TourProps } from "../types";

export type { ApprovalType12TourProps, ApprovalType12TourProps as Type12ApprovalCardProps };

export function Type12ApprovalCard(props: ApprovalType12TourProps) {
  return <Type12PlanCard {...props} />;
}

export { Type12ApprovalCard as ApprovalType12Tour };
