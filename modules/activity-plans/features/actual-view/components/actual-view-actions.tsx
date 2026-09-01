"use client";

import React from "react";
import { FormActionButtons } from "@/modules/activity-plans/ui/form-action-buttons";

interface ActualViewActionsProps {
  onBack: () => void;
  loading: boolean;
  submitLabel?: string;
}

export function ActualViewActions({
  onBack,
  loading,
  submitLabel = "บันทึกผล",
}: ActualViewActionsProps) {
  return (
    <FormActionButtons
      onBack={onBack}
      loading={loading}
      submitLabel={submitLabel}
    />
  );
}
