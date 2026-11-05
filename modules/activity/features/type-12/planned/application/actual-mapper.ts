import type { Type12ActualRecord } from "../types/actual.types";
import type { Type12ImageFile } from "../../shared/types";

export function parseType12ActualResult(result: any): Type12ActualRecord {
  if (!result) return {};

  const dedicated =
    result.type12Results?.[0] ||
    result.type12Targets?.[0]?.result ||
    result.target?.result ||
    result;

  let actualAttendees: string | number | undefined =
    dedicated?.actualAttendeesCount != null
      ? dedicated.actualAttendeesCount
      : result.actualAttendees;

  let tourHighlights: string | undefined =
    dedicated?.tourHighlights || result.tourHighlights;

  let feedbackIssues: string | undefined =
    dedicated?.feedbackIssues || result.feedbackIssues;

  const summary = dedicated?.summary || result.summary || "";

  if (actualAttendees == null && summary) {
    const attendeesMatch = summary.match(/ผู้ร่วมเดินทางจริง:\s*(\d+)/);
    if (attendeesMatch) actualAttendees = Number(attendeesMatch[1]);
  }

  if (!tourHighlights && summary) {
    const highlightsMatch = summary.match(/ไฮไลท์การดูงาน:\s*([^|]+)/);
    if (highlightsMatch) tourHighlights = highlightsMatch[1].trim();
  }

  if (!feedbackIssues && summary) {
    const feedbackMatch = summary.match(/ข้อคิดเห็น\/ปัญหา:\s*([^|]+)/);
    if (feedbackMatch) feedbackIssues = feedbackMatch[1].trim();
  }

  const rawAttachments = dedicated?.attachments || result.attachments;
  const images: Type12ImageFile[] = Array.isArray(rawAttachments)
    ? rawAttachments
        .filter(
          (a: any) =>
            a.workTypeCode === "TYPE_12" ||
            a.type12ResultId != null ||
            a.category === "ATMOSPHERE" ||
            a.category === "TOUR" ||
            a.category === "IMAGE",
        )
        .map((a: any) => ({
          id: a.id,
          url: a.fileUrl || a.url,
          name: a.fileName || a.name || "ภาพกิจกรรมศึกษาดูงาน",
          size: a.fileSize || a.size || 0,
          type: a.mimeType || a.type || "image/jpeg",
        }))
    : [];

  return {
    actualAttendees,
    tourHighlights,
    feedbackIssues,
    images,
  };
}
