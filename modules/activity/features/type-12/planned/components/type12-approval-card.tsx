"use client";

import React from "react";
import { Type12DetailView } from "./type12-detail-view";
import type { Type12ApprovalCardProps } from "../types/actual.types";

export type { Type12ApprovalCardProps };

export function Type12ApprovalCard(props: Type12ApprovalCardProps) {
  return <Type12DetailView {...props} />;
}

export { Type12ApprovalCard as ApprovalType12Tour };
