"use client";

import React from "react";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import { ApprovalType7aDemo } from "@/modules/activity-plans/features/type-7a/approval/approval-type7a-demo";
import { ApprovalType7bDemo } from "@/modules/activity-plans/features/type-7b/approval/approval-type7b-demo";

export interface ApprovalType7DemoProps {
  isVisible: boolean;
  workTypeCode?: "TYPE_7A" | "TYPE_7B" | string;
  target: ActualTargetsState["t7"] | any;
}

export function ApprovalType7Demo({
  isVisible,
  workTypeCode,
  target,
}: ApprovalType7DemoProps) {
  if (!isVisible) return null;

  const isFollowUp =
    workTypeCode === "TYPE_7B" ||
    (!workTypeCode &&
      (target.activityType === "FOLLOW_UP" ||
        target.activityType === "FOLLOWUP"));

  if (!isFollowUp) {
    return <ApprovalType7aDemo isVisible={isVisible} target={target} />;
  }

  return <ApprovalType7bDemo isVisible={isVisible} target={target} />;
}
