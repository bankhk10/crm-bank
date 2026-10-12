"use client";

import React from "react";
import { Type14PlanCard } from "./type14-plan-card";
import type { Type14ApprovalProps, Type14ApprovalCardProps } from "../types";

export type { Type14ApprovalProps, Type14ApprovalCardProps };

export function Type14ApprovalCard(props: Type14ApprovalProps) {
  return <Type14PlanCard {...props} />;
}

export { Type14ApprovalCard as Type14Approval };
export default Type14ApprovalCard;
