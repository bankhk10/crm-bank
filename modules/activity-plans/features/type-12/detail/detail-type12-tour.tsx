"use client";

import React from "react";
import { Type12PlanCard } from "../shared/type12-plan-card";
import type { DetailType12TourProps } from "./types";

export type { DetailType12TourProps };

export function DetailType12Tour(props: DetailType12TourProps) {
  return <Type12PlanCard {...props} />;
}

