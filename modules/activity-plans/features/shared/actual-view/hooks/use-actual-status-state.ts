"use client";

import { useState, useCallback } from "react";
import type { ActivityResultStatusType } from "../types";

export function useActualStatusState() {
  const [activityResultStatus, setActivityResultStatus] =
    useState<ActivityResultStatusType>("PARTIAL");
  const [cancelReason, setCancelReason] = useState("");
  const [postponedDate, setPostponedDate] = useState("");
  const [postponedTime, setPostponedTime] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [postponedNotes, setPostponedNotes] = useState("");

  const hydrateStatus = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.activityResultStatus) {
      setActivityResultStatus(parsed.activityResultStatus);
    }
    if (parsed.cancelReason) setCancelReason(parsed.cancelReason);
    if (parsed.postponedDate) setPostponedDate(parsed.postponedDate);
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
