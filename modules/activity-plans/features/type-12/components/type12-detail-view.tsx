"use client";

import React from "react";
import { Type12PlanCard } from "./type12-plan-card";
import type { DetailType12TourProps } from "../types";

export type { DetailType12TourProps, DetailType12TourProps as Type12DetailViewProps };

export function Type12DetailView(props: DetailType12TourProps) {
  return <Type12PlanCard {...props} />;
}

export { Type12DetailView as DetailType12Tour };
