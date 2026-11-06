"use client";

import { useState, useCallback } from "react";
import type { ActivityResultStatusType } from "../types";

export function useActualStatusState() {
  const [activityResultStatus, setActivityResultStatus] =
    useState<ActivityResultStatusType>("COMPLETED");
  const [cancelReason, setCancelReason] = useState("");
  const [postponedDate, setPostponedDate] = useState("");
  const [postponedTime, setPostponedTime] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [postponedNotes, setPostponedNotes] = useState("");

  const hydrateStatus = useCallback((parsed: any) => {
    if (!parsed) return;
    const status = parsed.activityResultStatus || parsed.resultStatus;
    if (status) {
      setActivityResultStatus(status);
    }
    if (parsed.cancelReason) setCancelReason(parsed.cancelReason);
    if (parsed.postponedDate) {
      if (typeof parsed.postponedDate === "string") {
        setPostponedDate(parsed.postponedDate.split("T")[0]);
      } else if (parsed.postponedDate instanceof Date) {
        setPostponedDate(parsed.postponedDate.toISOString().split("T")[0]);
      }
    }
    if (parsed.postponedTime) setPostponedTime(parsed.postponedTime);
    if (parsed.postponedReason) setPostponedReason(parsed.postponedReason);
    if (parsed.postponedNotes) setPostponedNotes(parsed.postponedNotes);
  }, []);

  return {
    activityResultStatus,
    setActivityResultStatus,
    cancelReason,
    setCancelReason,
    postponedDate,
    setPostponedDate,
    postponedTime,
    setPostponedTime,
    postponedReason,
    setPostponedReason,
    postponedNotes,
    setPostponedNotes,
    hydrateStatus,
  };
}
