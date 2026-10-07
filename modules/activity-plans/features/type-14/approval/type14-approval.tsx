"use client";

import React from "react";
import { Type14PlanCard } from "../shared/type14-plan-card";
import type { Type14ApprovalProps } from "./types";

export type { Type14ApprovalProps };

export function Type14Approval(props: Type14ApprovalProps) {
  return <Type14PlanCard {...props} />;
}

