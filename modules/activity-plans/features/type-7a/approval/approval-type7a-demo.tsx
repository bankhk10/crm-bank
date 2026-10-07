"use client";

import React from "react";
import { Type7aPlanCard } from "../shared/type7a-plan-card";
import type { ApprovalType7aDemoProps } from "../actual/types";

export type { ApprovalType7aDemoProps };

export function ApprovalType7aDemo({
  isVisible,
  target,
}: ApprovalType7aDemoProps) {
  if (!isVisible) return null;

  return <Type7aPlanCard target={target} />;
}

