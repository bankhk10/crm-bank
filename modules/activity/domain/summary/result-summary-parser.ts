import type { ParsedSummaryValues } from "./types";

/**
 * Parses the raw JSON string or ActivityResult object
 * into structured ParsedSummaryValues.
 */
export function parseResultSummary(resData: any): ParsedSummaryValues {
  const result: ParsedSummaryValues = {};

  if (!resData) return result;

  // 1. Direct fields from ActivityResult model / object
  if (typeof resData === "object") {
    if (resData.resultStatus) result.activityResultStatus = resData.resultStatus;
    if (resData.cancelReason) result.cancelReason = resData.cancelReason;
    if (resData.actualStartDate) {
      result.actualStartDate =
        typeof resData.actualStartDate === "string"
          ? resData.actualStartDate.split("T")[0]
          : new Date(resData.actualStartDate).toISOString().split("T")[0];
      result.t7StartDate = result.actualStartDate;
    }
    if (resData.postponedDate) {
      result.postponedDate =
        typeof resData.postponedDate === "string"
          ? resData.postponedDate.split("T")[0]
          : new Date(resData.postponedDate).toISOString().split("T")[0];
    }
    if (resData.postponedTime) result.postponedTime = resData.postponedTime;
    if (resData.postponedReason) result.postponedReason = resData.postponedReason;
    if (resData.postponedNotes) result.postponedNotes = resData.postponedNotes;
  }

  // 2. Parse resultSummary JSON payload (if exists)
  const rawSummary = typeof resData === "string" ? resData : resData?.resultSummary;
  if (rawSummary) {
    try {
      const parsed =
        typeof rawSummary === "string" ? JSON.parse(rawSummary) : rawSummary;
      if (parsed && typeof parsed === "object") {
        Object.assign(result, parsed);
      }
    } catch (err) {
      console.error("Failed to parse resultSummary JSON:", err);
    }
  }

  // 3. Fallback: If resData itself has extra fields, merge them
  if (typeof resData === "object") {
    if (resData.problemFound && !result.problemFound) {
      result.problemFound = resData.problemFound;
    }
    if (resData.nextAction && !result.nextAction) {
      result.nextAction = resData.nextAction;
    }
  }

  return result;
}
