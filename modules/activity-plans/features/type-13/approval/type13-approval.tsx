"use client";

import React from "react";
import { Type13PlanCard } from "../shared/type13-plan-card";
import type { Type13ApprovalProps } from "./types";

export type { Type13ApprovalProps };

export function Type13Approval(props: Type13ApprovalProps) {
  return <Type13PlanCard {...props} />;
}

export default Type13Approval;

