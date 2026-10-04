"use client";

import React from "react";
import { Type12PlanCard } from "../shared/type12-plan-card";
import type { ApprovalType12TourProps } from "./types";

export type { ApprovalType12TourProps };

export function ApprovalType12Tour(props: ApprovalType12TourProps) {
  return <Type12PlanCard {...props} />;
}

